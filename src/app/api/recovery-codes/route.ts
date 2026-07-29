import { auth } from "../../../lib/auth";
import {
  generateRecoveryCodes,
  getRecoveryCodeStatus,
} from "../../../server/recovery";
import { generateRecoveryCodesSchema } from "../../../server/recoverySchemas";
import {
  getRequestSession,
  unauthorizedResponse,
} from "../../../server/session";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return unauthorizedResponse();

  return Response.json(await getRecoveryCodeStatus(session.user.id), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return unauthorizedResponse();

  const validation = generateRecoveryCodesSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!validation.success) {
    return Response.json(
      { error: "Enter your current password" },
      { status: 400 },
    );
  }

  try {
    await auth.api.verifyPassword({
      headers: request.headers,
      body: { password: validation.data.password },
    });
  } catch {
    return Response.json(
      { error: "The current password is incorrect" },
      { status: 403 },
    );
  }

  return Response.json(await generateRecoveryCodes(session.user.id), {
    headers: { "Cache-Control": "no-store" },
  });
}
