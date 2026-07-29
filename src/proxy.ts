import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = new Set([
  "/forgot-password",
  "/login",
  "/signup",
  "/setup",
  "/two-factor",
]);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    publicRoutes.has(pathname) || pathname.startsWith("/invite/");
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|og.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
