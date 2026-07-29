import {
  consumeRecoveryRateLimit,
  resetPasswordWithRecoveryCode,
} from "../../../../server/recovery";
import { resetWithRecoveryCodeSchema } from "../../../../server/recoverySchemas";

const RECOVERY_WINDOW_MS = 15 * 60 * 1_000;

function requestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const validation = resetWithRecoveryCodeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!validation.success) {
    return Response.json(
      { error: "Check the email, recovery code, and new password" },
      { status: 400 },
    );
  }

  const [emailAllowed, addressAllowed] = await Promise.all([
    consumeRecoveryRateLimit(
      `email:${validation.data.email}`,
      5,
      RECOVERY_WINDOW_MS,
    ),
    consumeRecoveryRateLimit(
      `address:${requestAddress(request)}`,
      20,
      RECOVERY_WINDOW_MS,
    ),
  ]);

  if (!emailAllowed || !addressAllowed) {
    return Response.json(
      { error: "Too many attempts. Try again in 15 minutes" },
      { status: 429 },
    );
  }

  const reset = await resetPasswordWithRecoveryCode(validation.data);

  if (!reset) {
    return Response.json(
      { error: "The recovery details are invalid or expired" },
      { status: 400 },
    );
  }

  return Response.json(
    { status: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
