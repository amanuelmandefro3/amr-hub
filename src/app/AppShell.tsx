"use client";

import { usePathname } from "next/navigation";
import { IssueProvider } from "./IssueProvider";
import NavBar from "./NavBar";

const AUTH_ROUTES = [
  "/forgot-password",
  "/login",
  "/onboarding",
  "/signup",
  "/setup",
  "/invite",
  "/two-factor",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingRoute = pathname === "/";
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isLandingRoute) {
    return <div className="landing-content">{children}</div>;
  }

  if (isAuthRoute) {
    return <main className="auth-content">{children}</main>;
  }

  return (
    <IssueProvider>
      <div className="app-shell">
        <NavBar />
        <main className="app-content">{children}</main>
      </div>
    </IssueProvider>
  );
}
