import prisma from "../../prisma/client";

// Escalating lockout on top of the flat per-IP rate limit on /sign-in/email:
// this one is keyed by the targeted email, so it also slows down attackers
// who spread failed attempts across many IPs against a single account.
const LOCKOUT_SCHEDULE: Array<{ afterFailures: number; lockoutMs: number }> = [
  { afterFailures: 5, lockoutMs: 60 * 1_000 },
  { afterFailures: 10, lockoutMs: 5 * 60 * 1_000 },
  { afterFailures: 15, lockoutMs: 30 * 60 * 1_000 },
  { afterFailures: 20, lockoutMs: 2 * 60 * 60 * 1_000 },
];

export function lockoutDurationFor(failedCount: number) {
  let duration = 0;
  for (const tier of LOCKOUT_SCHEDULE) {
    if (failedCount >= tier.afterFailures) duration = tier.lockoutMs;
  }
  return duration;
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export async function getLoginLockout(email: string) {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { email: normalize(email) },
    select: { lockedUntil: true },
  });

  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    return attempt.lockedUntil;
  }
  return null;
}

export async function recordFailedLogin(email: string) {
  const normalized = normalize(email);
  const attempt = await prisma.loginAttempt.upsert({
    where: { email: normalized },
    create: { email: normalized, failedCount: 1 },
    update: { failedCount: { increment: 1 } },
  });

  const lockoutMs = lockoutDurationFor(attempt.failedCount);
  if (lockoutMs > 0) {
    await prisma.loginAttempt.update({
      where: { email: normalized },
      data: { lockedUntil: new Date(Date.now() + lockoutMs) },
    });
  }
}

export async function clearLoginAttempts(email: string) {
  await prisma.loginAttempt.deleteMany({
    where: { email: normalize(email) },
  });
}
