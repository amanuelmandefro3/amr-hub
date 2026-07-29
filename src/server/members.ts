import prisma from "../../prisma/client";

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
