import { z } from "zod";

export function normalizeRecoveryCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export const generateRecoveryCodesSchema = z
  .object({
    password: z.string().min(1).max(128),
  })
  .strict();

export const resetWithRecoveryCodeSchema = z
  .object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    code: z
      .string()
      .min(1)
      .max(128)
      .transform(normalizeRecoveryCode)
      .pipe(z.string().regex(/^AMR[A-F0-9]{24}$/)),
    newPassword: z.string().min(12).max(128),
  })
  .strict();
