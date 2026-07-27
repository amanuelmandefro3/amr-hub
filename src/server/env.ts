import { z } from "zod";

const postgresUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "postgresql:" || protocol === "postgres:";
      } catch {
        return false;
      }
    },
    { message: "must be a PostgreSQL connection URL" },
  );

export const serverEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  DIRECT_URL: postgresUrlSchema,
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function loadServerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const result = serverEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment - ${fields}`);
  }

  return result.data;
}
