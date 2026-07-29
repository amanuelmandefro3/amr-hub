import { describe, expect, it } from "vitest";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationTokenSchema,
} from "./invitationSchemas";

describe("invitation schemas", () => {
  it("normalizes valid invitation emails", () => {
    expect(
      createInvitationSchema.parse({ email: "  MEMBER@Example.com " }),
    ).toEqual({ email: "MEMBER@Example.com" });
  });

  it("rejects unknown invitation fields", () => {
    expect(
      createInvitationSchema.safeParse({
        email: "member@example.com",
        role: "OWNER",
      }).success,
    ).toBe(false);
  });

  it("accepts only URL-safe invitation tokens", () => {
    expect(invitationTokenSchema.safeParse("a".repeat(43)).success).toBe(true);
    expect(
      invitationTokenSchema.safeParse(`${"a".repeat(40)}+/=`).success,
    ).toBe(false);
  });

  it("enforces account name and password limits", () => {
    expect(
      acceptInvitationSchema.safeParse({
        token: "a".repeat(43),
        name: "A",
        password: "short",
      }).success,
    ).toBe(false);
  });
});
