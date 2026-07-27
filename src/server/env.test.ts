import { describe, expect, it } from "vitest";
import { loadServerEnvironment } from "./env";

const validEnvironment = {
  DATABASE_URL:
    "postgresql://app:secret@pool.example.com:5432/amr_hub?sslmode=require",
  DIRECT_URL:
    "postgresql://app:secret@db.example.com:5432/amr_hub?sslmode=require",
  NEXT_PUBLIC_APP_URL: "https://amr-hub.example.com",
};

describe("loadServerEnvironment", () => {
  it("accepts separate pooled and direct PostgreSQL URLs", () => {
    expect(loadServerEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it.each([
    ["a SQLite runtime URL", { DATABASE_URL: "file:./dev.db" }],
    ["a missing direct URL", { DIRECT_URL: undefined }],
    ["an invalid public origin", { NEXT_PUBLIC_APP_URL: "amr-hub" }],
  ])("rejects %s", (_, change) => {
    expect(() =>
      loadServerEnvironment({ ...validEnvironment, ...change }),
    ).toThrow("Invalid server environment");
  });
});
