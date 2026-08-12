import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkspaceSession: vi.fn(),
  removeWorkspaceMember: vi.fn(),
}));

vi.mock("../../../../server/session", async () => {
  const { NextResponse } = await import("next/server");
  const unauthorizedResponse = () =>
    NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const organizationRequiredResponse = () =>
    NextResponse.json(
      { error: "Organization required", code: "ORGANIZATION_REQUIRED" },
      { status: 409 },
    );
  const viewerForbiddenResponse = () =>
    NextResponse.json(
      { error: "Viewers have read-only access to this workspace" },
      { status: 403 },
    );

  async function requireWorkspaceSession(request: Request) {
    const session = await mocks.getWorkspaceSession(request);
    if (!session) return { response: unauthorizedResponse() };
    if (!session.workspace) return { response: organizationRequiredResponse() };
    return { session };
  }

  async function requireWorkspaceRole(
    request: Request,
    allowedRoles: string[],
    forbiddenResponse = viewerForbiddenResponse,
  ) {
    const result = await requireWorkspaceSession(request);
    if ("response" in result) return result;
    if (!allowedRoles.includes(result.session.workspace.role)) {
      return { response: forbiddenResponse() };
    }
    return result;
  }

  return {
    getWorkspaceSession: mocks.getWorkspaceSession,
    requireWorkspaceSession,
    requireWorkspaceRole,
    unauthorizedResponse,
    organizationRequiredResponse,
    viewerForbiddenResponse,
  };
});

vi.mock("../../../../server/members", () => ({
  removeWorkspaceMember: mocks.removeWorkspaceMember,
}));

import { DELETE } from "./route";

function request() {
  return new NextRequest("http://localhost:3000/api/members/member-1", {
    method: "DELETE",
  });
}

function context(id = "member-1") {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/members/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    mocks.getWorkspaceSession.mockResolvedValue(null);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(401);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("requires the owner role", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      user: { id: "member-2" },
      workspace: { id: "organization-1", role: "member" },
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(403);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("requires an active organization", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      user: { id: "owner-1" },
      workspace: null,
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(409);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("does not allow the owner account to remove itself", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      user: { id: "owner-1" },
      workspace: { id: "organization-1", role: "owner" },
    });

    const response = await DELETE(request(), context("owner-1"));

    expect(response.status).toBe(400);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("removes an existing member for the owner", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      user: { id: "owner-1" },
      workspace: { id: "organization-1", role: "owner" },
    });
    mocks.removeWorkspaceMember.mockResolvedValue(true);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.removeWorkspaceMember).toHaveBeenCalledWith(
      "member-1",
      "organization-1",
      "owner-1",
    );
  });

  it("returns not found without deleting an owner", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      user: { id: "owner-1" },
      workspace: { id: "organization-1", role: "owner" },
    });
    mocks.removeWorkspaceMember.mockResolvedValue(false);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(404);
  });
});
