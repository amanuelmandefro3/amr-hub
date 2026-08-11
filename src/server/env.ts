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

const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "must be an HTTP or HTTPS URL" },
  );

export const serverEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  DIRECT_URL: postgresUrlSchema,
  NEXT_PUBLIC_APP_URL: httpUrlSchema.optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
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

  if (environment.NODE_ENV === "production" && !result.data.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "Invalid server environment - NEXT_PUBLIC_APP_URL is required in production",
    );
  }

  return result.data;
}
