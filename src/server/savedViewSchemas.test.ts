import { describe, expect, it } from "vitest";
import { savedViewSchema } from "./savedViewSchemas";

const validView = {
  name: "Urgent customer work",
  query: "checkout",
  status: "ACTIVE",
  priority: "URGENT",
  assignee: "Amanuel R.",
  sort: "NEWEST",
  labelId: "label-customer",
} as const;

describe("savedViewSchema", () => {
  it("accepts a reusable issue filter", () => {
    expect(savedViewSchema.safeParse(validView).success).toBe(true);
  });

  it.each([
    ["unknown status", { status: "BLOCKED" }],
    ["unknown sort order", { sort: "POPULAR" }],
    ["empty owner", { assignee: "" }],
    ["name over 50 characters", { name: "a".repeat(51) }],
  ])("rejects %s", (_, change) => {
    expect(
      savedViewSchema.safeParse({ ...validView, ...change }).success,
    ).toBe(false);
  });
});
