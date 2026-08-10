import { z } from "zod";

export const projectStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
]);

const projectKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,5}$/, {
    message: "Key must be 2-6 letters/numbers, starting with a letter",
  });

const targetDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      const parsed = new Date(`${value}T12:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    },
    {
      message: "Target date must be a valid calendar date",
    },
  );

export const createProjectSchema = z
  .object({
    key: projectKeySchema,
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).nullable().default(null),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .default(null),
    targetDate: targetDateSchema.nullable().default(null),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional(),
    status: projectStatusSchema.optional(),
    targetDate: targetDateSchema.nullable().optional(),
  })
  .strict()
  .refine((updates) => Object.keys(updates).length > 0, {
    message: "Provide at least one project field to update",
  });

const cycleNameSchema = z.string().trim().min(2).max(80);
const cycleDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createCycleSchema = z
  .object({
    projectId: z.string().trim().min(1).max(120),
    name: cycleNameSchema,
    startDate: cycleDateSchema,
    endDate: cycleDateSchema,
    capacity: z.coerce.number().int().min(1).max(500),
  })
  .strict()
  .refine((input) => input.startDate < input.endDate, {
    message: "Start date must be before the end date",
    path: ["endDate"],
  });
