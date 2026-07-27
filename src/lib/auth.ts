import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../../prisma/client";
import { loadServerEnvironment } from "../server/env";

const environment = loadServerEnvironment();
const vercelDeploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null;
const applicationUrl =
  environment.NEXT_PUBLIC_APP_URL ??
  vercelDeploymentUrl ??
  "http://localhost:3000";
const trustedOrigins = [
  applicationUrl,
  environment.NEXT_PUBLIC_APP_URL,
  vercelDeploymentUrl,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  appName: "AMR Hub",
  telemetry: {
    enabled: false,
  },
  baseURL: applicationUrl,
  secret: environment.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "OWNER",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 15,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 3,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthSession = typeof auth.$Infer.Session;
