"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  UserRound,
} from "lucide-react";
import { authClient } from "../lib/auth-client";
import { useProjects } from "./ProjectProvider";
import { useCreateIssueModal } from "./CreateIssueModalProvider";
import { useSidebarCollapsed } from "./useSidebarCollapsed";
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
  const { isCollapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const { open: openCreateIssueModal } = useCreateIssueModal();

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
        openCreateIssueModal(activeProjectId);
      }
    };

    window.addEventListener("keydown", openCreateIssue);
    return () => window.removeEventListener("keydown", openCreateIssue);
  }, [isViewer, activeProjectId, openCreateIssueModal]);

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
      <aside className={isCollapsed ? "app-sidebar collapsed" : "app-sidebar"}>
        <div className="brand">
          <span className="brand-mark">A</span>
          <span className="brand-text">
            <strong>AMR Hub</strong>
            <small>{activeOrganization?.name ?? "Product workspace"}</small>
          </span>
          <button
            className="sidebar-collapse-toggle"
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight size={15} aria-hidden="true" />
            ) : (
              <ChevronsLeft size={15} aria-hidden="true" />
            )}
          </button>
        </div>

        <CommandPaletteHint />

        {!isViewer && (
          <button
            className="new-issue-button"
            type="button"
            onClick={() => openCreateIssueModal(activeProjectId)}
            aria-label="New issue"
            title="New issue"
          >
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="new-issue-label">New issue</span>
            <kbd>C</kbd>
          </button>
        )}

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "nav-link active" : "nav-link"}
              aria-label={label}
              title={label}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="nav-link-label">{label}</span>
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
                aria-label={project.name}
                title={project.name}
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
            <button
              type="button"
              className="mobile-create-button"
              onClick={() => openCreateIssueModal(activeProjectId)}
              aria-label="Create issue"
            >
              <Plus size={19} aria-hidden="true" />
            </button>
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
          <button
            className="mobile-nav-link"
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
          >
            <LogOut size={19} aria-hidden="true" />
          </button>
        </nav>
      </header>
    </>
  );
}
