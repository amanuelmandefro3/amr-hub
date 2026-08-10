import { z } from "zod";
import { sanitizeDescriptionHtml, stripHtml } from "./richText";

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
const assigneeIdSchema = z.string().trim().min(1).max(80).nullable();
const projectIdSchema = z.string().trim().min(1).max(120);

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

const descriptionSchema = z
  .string()
  .trim()
  .max(20000)
  .transform((value) => sanitizeDescriptionHtml(value))
  .refine((value) => stripHtml(value).length >= 12, {
    message: "Add enough detail for someone else to understand the issue.",
  });

export const createIssueSchema = z
  .object({
    title: z.string().trim().min(4).max(255),
    description: descriptionSchema,
    priority: issuePrioritySchema,
    kind: issueKindSchema,
    assigneeId: assigneeIdSchema,
    dueDate: dueDateSchema.nullable(),
    estimate: issueEstimateSchema.nullable(),
    projectId: projectIdSchema,
    cycleId: cycleIdSchema,
    labelIds: labelIdsSchema,
  })
  .strict();

export const updateIssueSchema = z
  .object({
    title: z.string().trim().min(4).max(255).optional(),
    description: descriptionSchema.optional(),
    status: issueStatusSchema.optional(),
    priority: issuePrioritySchema.optional(),
    kind: issueKindSchema.optional(),
    assigneeId: assigneeIdSchema.optional(),
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

export const listIssuesQuerySchema = z.object({
  status: z
    .union([z.literal("ALL"), z.literal("ACTIVE"), issueStatusSchema])
    .default("ALL"),
  priority: z.union([z.literal("ALL"), issuePrioritySchema]).default("ALL"),
  projectId: z.string().trim().min(1).max(120).optional(),
  labelId: z.string().trim().min(1).max(80).optional(),
  assigneeId: z.string().trim().min(1).max(80).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["NEWEST", "OLDEST"]).default("NEWEST"),
  cursor: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>;
