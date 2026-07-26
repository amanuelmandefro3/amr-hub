import { z } from "zod";

export const issueStatusSchema = z.enum([
  "BACKLOG",
  "OPEN",
  "IN_PROGRESS",
  "DONE",
]);

export const issuePrioritySchema = z.enum([
  "NO_PRIORITY",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const issueKindSchema = z.enum(["BUG", "FEATURE", "TASK"]);
export const issueEstimateSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
]);

const cycleIdSchema = z.string().trim().min(1).max(80).nullable();

const dueDateSchema = z
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
      message: "Due date must be a valid calendar date",
    },
  );

const labelIdsSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(10)
  .transform((labelIds) => [...new Set(labelIds)]);

export const createIssueSchema = z
  .object({
    title: z.string().trim().min(4).max(255),
    description: z.string().trim().min(12).max(2000),
    priority: issuePrioritySchema,
    kind: issueKindSchema,
    assignee: z.string().trim().min(1).max(80),
    dueDate: dueDateSchema.nullable(),
    estimate: issueEstimateSchema.nullable(),
    cycleId: cycleIdSchema,
    labelIds: labelIdsSchema,
  })
  .strict();

export const updateIssueSchema = z
  .object({
    title: z.string().trim().min(4).max(255).optional(),
    description: z.string().trim().min(12).max(2000).optional(),
    status: issueStatusSchema.optional(),
    priority: issuePrioritySchema.optional(),
    kind: issueKindSchema.optional(),
    assignee: z.string().trim().min(1).max(80).optional(),
    dueDate: dueDateSchema.nullable().optional(),
    estimate: issueEstimateSchema.nullable().optional(),
    cycleId: cycleIdSchema.optional(),
    labelIds: labelIdsSchema.optional(),
  })
  .strict()
  .refine((updates) => Object.keys(updates).length > 0, {
    message: "Provide at least one issue field to update",
  });

export const createCommentSchema = z
  .object({
    body: z.string().trim().min(2).max(1000),
  })
  .strict();
