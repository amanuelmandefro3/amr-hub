import { describe, expect, it } from "vitest";
import { isAuthRoute } from "./AppShell";

describe("auth route layout classification", () => {
  it("suppresses the workspace sidebar on every auth and recovery page", () => {
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/signup")).toBe(true);
    expect(isAuthRoute("/forgot-password")).toBe(true);
    expect(isAuthRoute("/forgot-password/recovery-code")).toBe(true);
    expect(isAuthRoute("/reset-password")).toBe(true);
    expect(isAuthRoute("/invite/example-token")).toBe(true);
    expect(isAuthRoute("/two-factor")).toBe(true);
  });

  it("shows the workspace sidebar on app routes", () => {
    expect(isAuthRoute("/dashboard")).toBe(false);
    expect(isAuthRoute("/issues")).toBe(false);
    expect(isAuthRoute("/account")).toBe(false);
  });
});
