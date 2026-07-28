import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json();

    if (!token || !name || !password) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { message: "Password must be at least 12 characters long." },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
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

    // Use Better Auth's signup endpoint
    const signupResponse = await fetch(new URL("/api/auth/sign-up/email", request.nextUrl.origin), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: invitation.email,
        password,
      }),
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      return NextResponse.json(
        { message: error.message || "Failed to create account." },
        { status: signupResponse.status }
      );
    }

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    // Return success - the user will be automatically signed in
    return NextResponse.json({
      message: "Account created successfully. You are now signed in.",
    });
  } catch (error) {
    console.error("Invitation acceptance error:", error);
    return NextResponse.json(
      { message: "Failed to accept invitation." },
      { status: 500 }
    );
  }
}
