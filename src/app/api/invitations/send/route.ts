import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";
import { headers } from "next/headers";
import { generateToken } from "../../../../lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { email, role = "MEMBER" } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Invalid email." },
        { status: 400 }
      );
    }

    if (!["MEMBER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This user already has an account." },
        { status: 400 }
      );
    }

    // Check if invitation already pending
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { message: "An invitation has already been sent to this email." },
        { status: 400 }
      );
    }

    // Create new invitation
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        role,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // TODO: Send email with invitation link
    // const invitationLink = `${request.nextUrl.origin}/invite/${token}`;
    // await sendInvitationEmail(email, invitationLink, session.user.name);

    return NextResponse.json({
      message: "Invitation sent successfully.",
      invitation,
    });
  } catch (error) {
    console.error("Send invitation error:", error);
    return NextResponse.json(
      { message: "Failed to send invitation." },
      { status: 500 }
    );
  }
}
