"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  UserRound,
} from "lucide-react";
import { authClient } from "../lib/auth-client";
import { useProjects } from "./ProjectProvider";
import { CommandPaletteHint } from "./components/CommandPalette";
import { NotificationInbox } from "./components/NotificationInbox";
import { ThemeToggle } from "./components/ThemeToggle";

const links = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Issues", href: "/issues", icon: ListTodo },
];

export default function NavBar() {
  const currentPath = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";
  const { projects, activeProjectId, setActiveProjectId } = useProjects();

  useEffect(() => {
    if (isViewer) return;

    const openCreateIssue = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === "c" && !isEditing) {
        event.preventDefault();
        router.push("/issues/new");
      }
    };

    window.addEventListener("keydown", openCreateIssue);
    return () => window.removeEventListener("keydown", openCreateIssue);
  }, [router, isViewer]);

  const isActive = (href: string) => currentPath.startsWith(href);

  const userName = session?.user.name ?? "Workspace member";
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <aside className="app-sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>
            <strong>AMR Hub</strong>
            <small>{activeOrganization?.name ?? "Product workspace"}</small>
          </span>
        </div>

        <CommandPaletteHint />

        {!isViewer && (
          <Link className="new-issue-button" href="/issues/new">
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            New issue
            <kbd>C</kbd>
          </Link>
        )}

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "nav-link active" : "nav-link"}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <nav className="project-switcher" aria-label="Projects">
          <span className="nav-label">Projects</span>
          {projects.length === 0 ? (
            <p className="project-switcher-empty">No projects yet</p>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                onClick={() => setActiveProjectId(project.id)}
                className={
                  activeProjectId === project.id
                    ? "project-switcher-item active"
                    : "project-switcher-item"
                }
              >
                <span style={{ background: project.color ?? "var(--gray-300)" }} />
                <span>{project.name}</span>
              </Link>
            ))
          )}
        </nav>

        <div className="sidebar-spacer" />

        <div className="user-row">
          <span className="avatar avatar-green">{initials || "AR"}</span>
          <Link className="user-identity" href="/account">
            <strong>{userName}</strong>
            <small>
              {activeMember?.role === "owner"
                ? "Workspace owner"
                : isViewer
                  ? "Workspace viewer"
                  : "Workspace member"}
            </small>
          </Link>
          <NotificationInbox openUpward />
          <ThemeToggle />
          <button
            className="sidebar-signout"
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <header className="mobile-header">
        <Link href="/dashboard" className="brand" aria-label="AMR Hub overview">
          <span className="brand-mark">A</span>
          <strong>AMR Hub</strong>
        </Link>
        <nav aria-label="Mobile navigation">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "mobile-nav-link active" : "mobile-nav-link"}
              aria-label={label}
            >
              <Icon size={19} aria-hidden="true" />
            </Link>
          ))}
          <NotificationInbox />
          <ThemeToggle />
          {!isViewer && (
            <Link
              href="/issues/new"
              className="mobile-create-button"
              aria-label="Create issue"
            >
              <Plus size={19} aria-hidden="true" />
            </Link>
          )}
          <Link
            href="/account"
            className={
              isActive("/account")
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
            aria-label="Account security"
          >
            <UserRound size={19} aria-hidden="true" />
          </Link>
        </nav>
      </header>
    </>
  );
}
