import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestSession: vi.fn(),
  removeWorkspaceMember: vi.fn(),
}));

vi.mock("../../../../server/session", async () => {
  const { NextResponse } = await import("next/server");
  return {
    getRequestSession: mocks.getRequestSession,
    unauthorizedResponse: () =>
      NextResponse.json({ error: "Authentication required" }, { status: 401 }),
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
    mocks.getRequestSession.mockResolvedValue(null);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(401);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("requires the owner role", async () => {
    mocks.getRequestSession.mockResolvedValue({
      user: { id: "member-2", role: "MEMBER" },
    });

    const response = await DELETE(request(), context());

    expect(response.status).toBe(403);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("does not allow the owner account to remove itself", async () => {
    mocks.getRequestSession.mockResolvedValue({
      user: { id: "owner-1", role: "OWNER" },
    });

    const response = await DELETE(request(), context("owner-1"));

    expect(response.status).toBe(400);
    expect(mocks.removeWorkspaceMember).not.toHaveBeenCalled();
  });

  it("removes an existing member for the owner", async () => {
    mocks.getRequestSession.mockResolvedValue({
      user: { id: "owner-1", role: "OWNER" },
    });
    mocks.removeWorkspaceMember.mockResolvedValue(true);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.removeWorkspaceMember).toHaveBeenCalledWith("member-1");
  });

  it("returns not found without deleting an owner", async () => {
    mocks.getRequestSession.mockResolvedValue({
      user: { id: "owner-1", role: "OWNER" },
    });
    mocks.removeWorkspaceMember.mockResolvedValue(false);

    const response = await DELETE(request(), context());

    expect(response.status).toBe(404);
  });
});
