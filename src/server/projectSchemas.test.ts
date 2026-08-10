import { describe, expect, it } from "vitest";
import { createCycleSchema, createProjectSchema } from "./projectSchemas";

describe("createProjectSchema", () => {
  it("accepts a minimal project", () => {
    const result = createProjectSchema.safeParse({
      key: "eng",
      name: "Engineering",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.key).toBe("ENG");
  });

  it.each([
    ["single-letter key", { key: "E" }],
    ["key with a leading digit", { key: "1ENG" }],
    ["too-long key", { key: "ENGINEERING" }],
    ["short name", { name: "A" }],
    ["invalid color", { color: "blue" }],
    ["malformed target date", { targetDate: "2026-13-01" }],
  ])("rejects %s", (_, change) => {
    const result = createProjectSchema.safeParse({
      key: "eng",
      name: "Engineering",
      ...change,
    });

    expect(result.success).toBe(false);
  });

  it("rejects fields outside the public API contract", () => {
    const result = createProjectSchema.safeParse({
      key: "eng",
      name: "Engineering",
      status: "COMPLETED",
    });

    expect(result.success).toBe(false);
  });
});

describe("createCycleSchema", () => {
  const validCycle = {
    projectId: "project-1",
    name: "Cycle 1",
    startDate: "2026-08-01",
    endDate: "2026-08-14",
    capacity: 40,
  };

  it("accepts a valid cycle", () => {
    expect(createCycleSchema.safeParse(validCycle).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = createCycleSchema.safeParse({
      ...validCycle,
      startDate: "2026-08-14",
      endDate: "2026-08-01",
    });

    expect(result.success).toBe(false);
  });
});
