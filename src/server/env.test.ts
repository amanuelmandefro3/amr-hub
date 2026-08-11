import { describe, expect, it } from "vitest";
import { loadServerEnvironment } from "./env";

const validEnvironment = {
  DATABASE_URL:
    "postgresql://app:secret@pool.example.com:5432/amr_hub?sslmode=require",
  DIRECT_URL:
    "postgresql://app:secret@db.example.com:5432/amr_hub?sslmode=require",
  NEXT_PUBLIC_APP_URL: "https://amr-hub.example.com",
  BETTER_AUTH_SECRET: "a".repeat(32),
};

describe("loadServerEnvironment", () => {
  it("accepts database and authentication configuration", () => {
    expect(loadServerEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it.each([
    ["a SQLite runtime URL", { DATABASE_URL: "file:./dev.db" }],
    ["a missing direct URL", { DIRECT_URL: undefined }],
    ["an invalid public origin", { NEXT_PUBLIC_APP_URL: "amr-hub" }],
    ["a short authentication secret", { BETTER_AUTH_SECRET: "short" }],
  ])("rejects %s", (_, change) => {
    expect(() =>
      loadServerEnvironment({ ...validEnvironment, ...change }),
    ).toThrow("Invalid server environment");
  });

  it("rejects a production environment missing the public app URL", () => {
    expect(() =>
      loadServerEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: undefined,
      }),
    ).toThrow("NEXT_PUBLIC_APP_URL is required in production");
  });

  it("allows a non-production environment to fall back on the public app URL", () => {
    expect(() =>
      loadServerEnvironment({
        ...validEnvironment,
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: undefined,
      }),
    ).not.toThrow();
  });
});
