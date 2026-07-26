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

export const createIssueSchema = z
  .object({
    title: z.string().trim().min(4).max(255),
    description: z.string().trim().min(12).max(2000),
    priority: issuePrioritySchema,
    kind: issueKindSchema,
    assignee: z.string().trim().min(1).max(80),
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
