import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { organization, twoFactor } from "better-auth/plugins";
import prisma from "../../prisma/client";
import { loadServerEnvironment } from "../server/env";
import { organizationOnboardingSchema } from "../server/organizationSchemas";

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
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const membership = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId ?? null,
            },
          };
        },
      },
    },
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
      "/two-factor/verify-totp": {
        window: 60,
        max: 6,
      },
      "/two-factor/verify-backup-code": {
        window: 60,
        max: 6,
      },
    },
  },
  plugins: [
    organization({
      organizationLimit: 1,
      membershipLimit: 100,
      schema: {
        organization: {
          additionalFields: {
            key: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },
        invitation: {
          modelName: "organizationInvitation",
        },
      },
      allowUserToCreateOrganization: async (user) =>
        (await prisma.member.count({ where: { userId: user.id } })) === 0,
      organizationHooks: {
        beforeCreateOrganization: async ({ organization }) => {
          const validation = organizationOnboardingSchema.safeParse(
            organization,
          );

          if (!validation.success) {
            throw new APIError("BAD_REQUEST", {
              message:
                validation.error.issues[0]?.message ??
                "Organization details are invalid",
            });
          }

          return {
            data: {
              ...organization,
              ...validation.data,
            },
          };
        },
      },
    }),
    twoFactor({
      issuer: "AMR Hub",
      twoFactorCookieMaxAge: 60 * 10,
      trustDeviceMaxAge: 60 * 60 * 24 * 30,
      backupCodeOptions: {
        amount: 10,
        length: 12,
      },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 60 * 15,
      },
    }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthSession = typeof auth.$Infer.Session;
