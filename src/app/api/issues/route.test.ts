import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkspaceSession: vi.fn(),
  listIssues: vi.fn(),
  createIssue: vi.fn(),
}));

vi.mock("../../../server/session", async () => {
  const { NextResponse } = await import("next/server");
  return {
    getWorkspaceSession: mocks.getWorkspaceSession,
    actorFromSession: (session: {
      user: { id: string; name: string };
      workspace: { id: string; key: string };
    }) => ({
      id: session.user.id,
      name: session.user.name,
      organizationId: session.workspace.id,
      organizationKey: session.workspace.key,
    }),
    unauthorizedResponse: () =>
      NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    organizationRequiredResponse: () =>
      NextResponse.json(
        { error: "Organization required", code: "ORGANIZATION_REQUIRED" },
        { status: 409 },
      ),
  };
});

vi.mock("../../../server/issues", () => ({
  listIssues: mocks.listIssues,
  createIssue: mocks.createIssue,
  UnknownCycleError: class extends Error {},
  UnknownLabelError: class extends Error {},
}));

import { GET, POST } from "./route";

const session = {
  user: { id: "owner-1", name: "Owner" },
  workspace: {
    id: "organization-1",
    key: "ACME",
    role: "owner",
  },
};

function request(method = "GET", body?: object) {
  return new NextRequest("http://localhost:3000/api/issues", {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/issues organization boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects accounts without an active organization", async () => {
    mocks.getWorkspaceSession.mockResolvedValue({
      ...session,
      workspace: null,
    });

    const response = await GET(request());

    expect(response.status).toBe(409);
    expect(mocks.listIssues).not.toHaveBeenCalled();
  });

  it("lists only the active organization", async () => {
    mocks.getWorkspaceSession.mockResolvedValue(session);
    mocks.listIssues.mockResolvedValue([]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(mocks.listIssues).toHaveBeenCalledWith("organization-1");
  });

  it("creates issues with the active organization and issue key", async () => {
    const input = {
      title: "Organization-aware issue",
      description: "This issue belongs to the active organization.",
      priority: "HIGH",
      kind: "TASK",
      assignee: "Owner",
      dueDate: null,
      estimate: 3,
      cycleId: null,
      labelIds: [],
    };
    mocks.getWorkspaceSession.mockResolvedValue(session);
    mocks.createIssue.mockResolvedValue({ id: "ACME-1", ...input });

    const response = await POST(request("POST", input));

    expect(response.status).toBe(201);
    expect(mocks.createIssue).toHaveBeenCalledWith(input, {
      id: "owner-1",
      name: "Owner",
      organizationId: "organization-1",
      organizationKey: "ACME",
    });
  });
});
