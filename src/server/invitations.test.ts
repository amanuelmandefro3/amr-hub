import { describe, expect, it } from "vitest";
import {
  createInvitationToken,
  hashInvitationToken,
  normalizeInvitationEmail,
} from "./invitations";

describe("invitation security helpers", () => {
  it("normalizes account email addresses", () => {
    expect(normalizeInvitationEmail("  MEMBER@Example.COM ")).toBe(
      "member@example.com",
    );
  });

  it("creates high-entropy URL-safe tokens", () => {
    const first = createInvitationToken();
    const second = createInvitationToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });

  it("stores deterministic hashes rather than raw bearer tokens", () => {
    const token = "a".repeat(43);
    const digest = hashInvitationToken(token);

    expect(digest).toHaveLength(64);
    expect(digest).not.toContain(token);
    expect(hashInvitationToken(token)).toBe(digest);
  });
});
