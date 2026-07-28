import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { inviter: { select: { name: true } } },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found." },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { message: "This invitation has already been used." },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { message: "This invitation has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.inviter.name,
    });
  } catch (error) {
    console.error("Invitation verification error:", error);
    return NextResponse.json(
      { message: "Failed to verify invitation." },
      { status: 500 }
    );
  }
}
