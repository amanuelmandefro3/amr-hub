import { describe, expect, it } from "vitest";
import { isPublicPath } from "./proxy";

describe("public route access", () => {
  it("keeps the product and authentication entry points public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup")).toBe(true);
    expect(isPublicPath("/invite/example-token")).toBe(true);
  });

  it("keeps workspace routes behind authentication", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/issues")).toBe(false);
    expect(isPublicPath("/cycles")).toBe(false);
    expect(isPublicPath("/account")).toBe(false);
  });
});
