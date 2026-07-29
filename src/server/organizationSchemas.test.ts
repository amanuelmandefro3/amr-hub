import { describe, expect, it } from "vitest";
import {
  keyFromOrganizationName,
  organizationOnboardingSchema,
  slugFromOrganizationName,
} from "./organizationSchemas";

describe("organization onboarding validation", () => {
  it("normalizes valid organization details", () => {
    expect(
      organizationOnboardingSchema.parse({
        name: "  Acme Product  ",
        slug: "ACME-Product",
        key: "acme",
      }),
    ).toEqual({
      name: "Acme Product",
      slug: "acme-product",
      key: "ACME",
    });
  });

  it.each([
    { name: "A", slug: "acme", key: "AC" },
    { name: "Acme", slug: "Acme Space", key: "AC" },
    { name: "Acme", slug: "acme", key: "1AC" },
    { name: "Acme", slug: "acme", key: "TOOLONG" },
  ])("rejects invalid organization details", (input) => {
    expect(organizationOnboardingSchema.safeParse(input).success).toBe(false);
  });

  it("derives readable slugs and issue keys", () => {
    expect(slugFromOrganizationName("North Star Labs")).toBe(
      "north-star-labs",
    );
    expect(keyFromOrganizationName("North Star Labs")).toBe("NSL");
    expect(keyFromOrganizationName("Acme")).toBe("ACME");
  });
});
