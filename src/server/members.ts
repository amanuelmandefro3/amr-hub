import prisma from "../../prisma/client";
import type { WorkspaceMember } from "../app/data/issues";

export async function listOrganizationMembers(
  organizationId: string,
): Promise<WorkspaceMember[]> {
  const members = await prisma.member.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return members.map((member) => ({
    id: member.id,
    name: member.user.name,
    email: member.user.email,
  }));
}

export async function removeWorkspaceMember(
  userId: string,
  organizationId: string,
) {
  const result = await prisma.member.deleteMany({
    where: {
      userId,
      organizationId,
      role: "member",
    },
  });

  if (result.count === 1) {
    await prisma.session.deleteMany({
      where: {
        userId,
        activeOrganizationId: organizationId,
      },
    });
  }

  return result.count === 1;
}
