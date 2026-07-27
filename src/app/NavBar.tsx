"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  UserRound,
} from "lucide-react";
import { authClient } from "../lib/auth-client";

const links = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Issues", href: "/issues", icon: ListTodo },
  { label: "Cycles", href: "/cycles", icon: CalendarRange },
];

export default function NavBar() {
  const currentPath = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
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
  }, [router]);

  const isActive = (href: string) =>
    href === "/" ? currentPath === href : currentPath.startsWith(href);

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
            <small>Product workspace</small>
          </span>
        </div>

        <Link className="new-issue-button" href="/issues/new">
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          New issue
          <kbd>C</kbd>
        </Link>

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

        <div className="sidebar-spacer" />

        <div className="user-row">
          <span className="avatar avatar-green">{initials || "AR"}</span>
          <Link className="user-identity" href="/account">
            <strong>{userName}</strong>
            <small>
              {session?.user.role === "OWNER"
                ? "Workspace owner"
                : "Workspace member"}
            </small>
          </Link>
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
        <Link href="/" className="brand" aria-label="AMR Hub overview">
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
          <Link
            href="/issues/new"
            className="mobile-create-button"
            aria-label="Create issue"
          >
            <Plus size={19} aria-hidden="true" />
          </Link>
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
