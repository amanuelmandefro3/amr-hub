import { z } from "zod";

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters")
  .max(80, "Organization name must be 80 characters or fewer");

export const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Workspace handle must be at least 3 characters")
  .max(48, "Workspace handle must be 48 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens",
  );

export const organizationKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "Workspace key must be at least 2 characters")
  .max(5, "Workspace key must be 5 characters or fewer")
  .regex(/^[A-Z][A-Z0-9]*$/, "Start with a letter and use letters or numbers");

export const organizationOnboardingSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
  key: organizationKeySchema,
});

export function slugFromOrganizationName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export function keyFromOrganizationName(name: string) {
  const words = name
    .trim()
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  const initials = words.map((word) => word[0]).join("");

  if (initials.length >= 2) return initials.slice(0, 5);

  return (words[0] ?? "WS").replace(/[^A-Z0-9]/g, "").slice(0, 5);
}
