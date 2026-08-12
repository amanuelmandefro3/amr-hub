import { describe, expect, it } from "vitest";
import { lockoutDurationFor } from "./loginThrottle";

describe("lockoutDurationFor", () => {
  it("allows attempts under the first threshold", () => {
    expect(lockoutDurationFor(0)).toBe(0);
    expect(lockoutDurationFor(4)).toBe(0);
  });

  it("escalates the lockout as failures climb", () => {
    expect(lockoutDurationFor(5)).toBe(60 * 1_000);
    expect(lockoutDurationFor(9)).toBe(60 * 1_000);
    expect(lockoutDurationFor(10)).toBe(5 * 60 * 1_000);
    expect(lockoutDurationFor(15)).toBe(30 * 60 * 1_000);
    expect(lockoutDurationFor(20)).toBe(2 * 60 * 60 * 1_000);
  });

  it("holds the longest tier for failures beyond the schedule", () => {
    expect(lockoutDurationFor(1_000)).toBe(2 * 60 * 60 * 1_000);
  });
});
