import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import prisma from "../../prisma/client";

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type InvitationErrorCode =
  | "ALREADY_INVITED"
  | "EMAIL_IN_USE"
  | "INVITATION_INVALID";

export class InvitationError extends Error {
  constructor(public readonly code: InvitationErrorCode) {
    super(code);
  }
}

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function invitationState(
  invitation: { status: string; expiresAt: Date },
  now = new Date(),
) {
  if (invitation.status === "PENDING" && invitation.expiresAt <= now) {
    return "EXPIRED";
  }

  return invitation.status;
}

export async function listWorkspaceAccess() {
  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        inviter: {
          select: { name: true },
        },
      },
    }),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      status: invitationState(invitation),
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      invitedBy: invitation.inviter.name,
    })),
  };
}

export async function createMemberInvitation(
  email: string,
  invitedBy: string,
  origin: string,
) {
  const normalizedEmail = normalizeInvitationEmail(email);
  const token = createInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

  try {
    const invitation = await prisma.$transaction(async (transaction) => {
      await transaction.invitation.updateMany({
        where: {
          email: normalizedEmail,
          status: "PENDING",
          expiresAt: { lte: new Date() },
        },
        data: { status: "REVOKED" },
      });

      const existingUser = await transaction.user.count({
        where: { email: normalizedEmail },
      });
      if (existingUser > 0) throw new InvitationError("EMAIL_IN_USE");

      return transaction.invitation.create({
        data: {
          id: randomUUID(),
          email: normalizedEmail,
          tokenHash: hashInvitationToken(token),
          expiresAt,
          invitedBy,
        },
      });
    });

    return {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
      },
      inviteUrl: new URL(`/invite/${token}`, origin).toString(),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new InvitationError("ALREADY_INVITED");
    }
    throw error;
  }
}

export async function getInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: {
      inviter: {
        select: { name: true },
      },
    },
  });

  if (!invitation || invitationState(invitation) !== "PENDING") {
    throw new InvitationError("INVITATION_INVALID");
  }

  return {
    email: invitation.email,
    invitedBy: invitation.inviter.name,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

export async function acceptMemberInvitation(input: {
  token: string;
  name: string;
  password: string;
}) {
  const tokenHash = hashInvitationToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  try {
    return await prisma.$transaction(async (transaction) => {
      const invitation = await transaction.invitation.findUnique({
        where: { tokenHash },
      });

      if (
        !invitation ||
        invitation.status !== "PENDING" ||
        invitation.expiresAt <= now
      ) {
        throw new InvitationError("INVITATION_INVALID");
      }

      const claimed = await transaction.invitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          expiresAt: { gt: now },
        },
        data: { status: "ACCEPTED" },
      });
      if (claimed.count !== 1) {
        throw new InvitationError("INVITATION_INVALID");
      }

      const userId = randomUUID();
      const user = await transaction.user.create({
        data: {
          id: userId,
          name: input.name,
          email: invitation.email,
          emailVerified: false,
          role: "MEMBER",
        },
        select: {
          id: true,
          email: true,
        },
      });

      await transaction.account.create({
        data: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
        },
      });

      return user;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new InvitationError("EMAIL_IN_USE");
    }
    throw error;
  }
}

export async function revokeInvitation(id: string) {
  const result = await prisma.invitation.updateMany({
    where: {
      id,
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  return result.count === 1;
}
