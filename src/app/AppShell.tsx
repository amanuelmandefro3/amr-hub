"use client";

import { usePathname } from "next/navigation";
import { IssueProvider } from "./IssueProvider";
import { ProjectProvider } from "./ProjectProvider";
import { NotificationProvider } from "./NotificationProvider";
import { CreateIssueModalProvider } from "./CreateIssueModalProvider";
import { CommandPalette } from "./components/CommandPalette";
import NavBar from "./NavBar";

const AUTH_ROUTES = [
  "/forgot-password",
  "/reset-password",
  "/login",
  "/onboarding",
  "/signup",
  "/setup",
  "/invite",
  "/two-factor",
];

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingRoute = pathname === "/";
  const isOnAuthRoute = isAuthRoute(pathname);

  if (isLandingRoute) {
    return <div className="landing-content">{children}</div>;
  }

  if (isOnAuthRoute) {
    return <main className="auth-content">{children}</main>;
  }

  return (
    <ProjectProvider>
      <NotificationProvider>
        <IssueProvider>
          <CreateIssueModalProvider>
            <div className="app-shell">
              <NavBar />
              <main className="app-content">{children}</main>
              <CommandPalette />
            </div>
          </CreateIssueModalProvider>
        </IssueProvider>
      </NotificationProvider>
    </ProjectProvider>
  );
}
