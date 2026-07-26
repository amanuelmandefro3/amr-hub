"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  LayoutDashboard,
  ListTodo,
  Plus,
} from "lucide-react";

const links = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Issues", href: "/issues", icon: ListTodo },
  { label: "Cycles", href: "/cycles", icon: CalendarRange },
];

export default function NavBar() {
  const currentPath = usePathname();
  const router = useRouter();

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
          <span className="avatar avatar-green">AR</span>
          <span>
            <strong>Amanuel R.</strong>
            <small>Workspace admin</small>
          </span>
          <span className="online-dot" title="Online" />
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
        </nav>
      </header>
    </>
  );
}
