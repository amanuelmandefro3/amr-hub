import { z } from "zod";

export const invitationTokenSchema = z
  .string()
  .trim()
  .min(32)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const invitationRoleSchema = z.enum(["member", "viewer"]);

export const createInvitationSchema = z
  .object({
    email: z.string().trim().email().max(254),
    role: invitationRoleSchema.default("member"),
  })
  .strict();

export const acceptInvitationSchema = z
  .object({
    token: invitationTokenSchema,
    name: z.string().trim().min(2).max(80),
    password: z.string().min(12).max(128),
  })
  .strict();
