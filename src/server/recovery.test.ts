import { describe, expect, it } from "vitest";
import { createRecoveryCode } from "./recovery";

describe("password recovery helpers", () => {
  it("creates high-entropy grouped recovery codes", () => {
    const first = createRecoveryCode();
    const second = createRecoveryCode();

    expect(first).toMatch(/^AMR(?:-[A-F0-9]{4}){6}$/);
    expect(second).toMatch(/^AMR(?:-[A-F0-9]{4}){6}$/);
    expect(first).not.toBe(second);
  });
});
