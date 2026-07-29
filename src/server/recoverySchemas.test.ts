import { describe, expect, it } from "vitest";
import {
  generateRecoveryCodesSchema,
  normalizeRecoveryCode,
  resetWithRecoveryCodeSchema,
} from "./recoverySchemas";

describe("password recovery schemas", () => {
  it("normalizes grouped recovery codes", () => {
    expect(
      normalizeRecoveryCode(" amr-abcd-1234-ef00-5678-abcd-1234 "),
    ).toBe("AMRABCD1234EF005678ABCD1234");
  });

  it("accepts only AMR recovery code shape and strong passwords", () => {
    expect(
      resetWithRecoveryCodeSchema.safeParse({
        email: " OWNER@EXAMPLE.COM ",
        code: "AMR-ABCD-1234-EF00-5678-ABCD-1234",
        newPassword: "a secure password",
      }).success,
    ).toBe(true);
    expect(
      resetWithRecoveryCodeSchema.safeParse({
        email: "owner@example.com",
        code: "not-a-code",
        newPassword: "a secure password",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown generation fields", () => {
    expect(
      generateRecoveryCodesSchema.safeParse({
        password: "current password",
        userId: "another-user",
      }).success,
    ).toBe(false);
  });
});
