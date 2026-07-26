import { z } from "zod";
import { issuePrioritySchema, issueStatusSchema } from "./issueSchemas";

export const savedViewSchema = z
  .object({
    name: z.string().trim().min(2).max(50),
    query: z.string().trim().max(100),
    status: z.union([
      z.literal("ALL"),
      z.literal("ACTIVE"),
      issueStatusSchema,
    ]),
    priority: z.union([z.literal("ALL"), issuePrioritySchema]),
    assignee: z.string().trim().min(1).max(80),
    sort: z.enum(["NEWEST", "OLDEST"]),
    labelId: z.string().trim().min(1).max(80).nullable(),
  })
  .strict();
