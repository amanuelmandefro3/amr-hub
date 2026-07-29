import prisma from "../../prisma/client";

export async function removeWorkspaceMember(userId: string) {
  const result = await prisma.user.deleteMany({
    where: {
      id: userId,
      role: "MEMBER",
    },
  });

  return result.count === 1;
}
