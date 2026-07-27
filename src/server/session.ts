import { NextResponse } from "next/server";
import { auth, type AuthSession } from "../lib/auth";

export async function getRequestSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export function actorFromSession(session: AuthSession) {
  return {
    id: session.user.id,
    name: session.user.name,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}
