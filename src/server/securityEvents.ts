import prisma from "../../prisma/client";

export type SecurityEventType =
  | "password_changed"
  | "password_reset"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "session_revoked"
  | "sessions_revoked"
  | "invitation_created"
  | "invitation_revoked"
  | "invitation_accepted"
  | "member_removed";

export async function recordSecurityEvent(input: {
  type: SecurityEventType;
  userId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, string>;
}) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    // Audit logging must never block the security action it's recording.
    console.error("Failed to record security event", input.type, error);
  }
}

export async function listSecurityEvents(userId: string, limit = 50) {
  const events = await prisma.securityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    metadata: event.metadata
      ? (JSON.parse(event.metadata) as Record<string, string>)
      : null,
    createdAt: event.createdAt.toISOString(),
  }));
}
