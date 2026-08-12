import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import prisma from "../../prisma/client";
import { recordSecurityEvent } from "./securityEvents";

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1_000;

function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function createRecoveryCode() {
  const payload = randomBytes(12).toString("hex").toUpperCase();
  return `AMR-${payload.match(/.{1,4}/g)?.join("-")}`;
}

export async function getRecoveryCodeStatus(userId: string) {
  const now = new Date();
  const codes = await prisma.recoveryCode.findMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    activeCount: codes.length,
    createdAt: codes[0]?.createdAt.toISOString() ?? null,
    expiresAt: codes[0]?.expiresAt.toISOString() ?? null,
  };
}

export async function generateRecoveryCodes(userId: string) {
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    createRecoveryCode(),
  );
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + RECOVERY_CODE_LIFETIME_MS);

  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.recoveryCode.createMany({
      data: codes.map((code) => ({
        id: randomUUID(),
        codeHash: hashRecoveryCode(code.replaceAll("-", "")),
        userId,
        createdAt,
        expiresAt,
      })),
    }),
  ]);

  return {
    codes,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resetPasswordWithRecoveryCode(input: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const codeHash = hashRecoveryCode(input.code);
  const passwordHash = await hashPassword(input.newPassword);
  const now = new Date();

  const result = await prisma.$transaction(async (transaction) => {
    const recoveryCode = await transaction.recoveryCode.findFirst({
      where: {
        codeHash,
        usedAt: null,
        expiresAt: { gt: now },
        user: { email: input.email },
      },
      select: { id: true, userId: true },
    });

    if (!recoveryCode) return null;

    const claimed = await transaction.recoveryCode.updateMany({
      where: {
        id: recoveryCode.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) return null;

    const credential = await transaction.account.updateMany({
      where: {
        userId: recoveryCode.userId,
        providerId: "credential",
      },
      data: { password: passwordHash },
    });

    if (credential.count !== 1) {
      throw new Error("Recovery account does not have one credential");
    }

    await transaction.recoveryCode.updateMany({
      where: {
        userId: recoveryCode.userId,
        usedAt: null,
      },
      data: { usedAt: now },
    });
    await transaction.session.deleteMany({
      where: { userId: recoveryCode.userId },
    });

    return recoveryCode.userId;
  });

  if (result) {
    await recordSecurityEvent({ type: "password_reset", userId: result });
  }

  return result !== null;
}

export async function consumeRecoveryRateLimit(
  identifier: string,
  maximumAttempts: number,
  windowMs: number,
) {
  const key = `password-recovery:${createHash("sha256")
    .update(identifier)
    .digest("hex")}`;
  const now = BigInt(Date.now());
  const windowStart = now - BigInt(windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${windowStart} THEN 1
        ELSE "rateLimit"."count" + 1
      END,
      "lastRequest" = ${now}
    RETURNING "count"
  `;

  return (rows[0]?.count ?? maximumAttempts + 1) <= maximumAttempts;
}
