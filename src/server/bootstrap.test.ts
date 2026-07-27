import { describe, expect, it } from "vitest";
import { isValidBootstrapToken } from "./bootstrap";

describe("isValidBootstrapToken", () => {
  const expected = "a-private-bootstrap-token-with-32-characters";

  it("accepts the configured token", () => {
    expect(isValidBootstrapToken(expected, expected)).toBe(true);
  });

  it.each([null, "", "wrong-token"])("rejects %s", (candidate) => {
    expect(isValidBootstrapToken(candidate, expected)).toBe(false);
  });
});
