"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  ListFilter,
  Plus,
  Search,
} from "lucide-react";
import { useIssues } from "../IssueProvider";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type IssuePriority,
  type IssueStatus,
} from "../data/issues";
import { KindIcon, PriorityBadge } from "../components/IssueVisuals";

type StatusFilter = "ALL" | "ACTIVE" | IssueStatus;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All issues", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Backlog", value: "BACKLOG" },
  { label: "Completed", value: "DONE" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function initials(name: string) {
  if (name === "Unassigned") return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export default function IssuesPage() {
  const { issues, updateStatus, resetDemo } = useIssues();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "ALL">(
    "ALL",
  );
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const visibleIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return issues
      .filter((issue) => {
        const matchesQuery =
          !normalizedQuery ||
          issue.title.toLowerCase().includes(normalizedQuery) ||
          issue.id.toLowerCase().includes(normalizedQuery) ||
          issue.assignee.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && issue.status !== "DONE") ||
          issue.status === statusFilter;
        const matchesPriority =
          priorityFilter === "ALL" || issue.priority === priorityFilter;

        return matchesQuery && matchesStatus && matchesPriority;
      })
      .sort((left, right) => {
        const difference =
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sortNewestFirst ? difference : -difference;
      });
  }, [issues, priorityFilter, query, sortNewestFirst, statusFilter]);

  return (
    <div className="page issues-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Issues</h1>
          <p className="page-description">
            Prioritize, assign, and move work through delivery.
          </p>
        </div>
        <Link className="primary-button" href="/issues/new">
          <Plus size={16} aria-hidden="true" />
          New issue
        </Link>
      </header>

      <div className="issue-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Issue status">
          {statusFilters.map((filter) => (
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.value}
              className={statusFilter === filter.value ? "active" : ""}
              onClick={() => setStatusFilter(filter.value)}
              key={filter.value}
            >
              {filter.label}
              {filter.value === "ALL" && <span>{issues.length}</span>}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <label className="search-field">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search issues</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues..."
            />
          </label>
          <label className="select-button">
            <ListFilter size={16} aria-hidden="true" />
            <span className="sr-only">Filter by priority</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as IssuePriority | "ALL")
              }
            >
              <option value="ALL">All priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="issues-table-panel" aria-label="Issues list">
        <div className="table-summary">
          <span>{visibleIssues.length} issues</span>
          <button
            type="button"
            onClick={() => setSortNewestFirst((current) => !current)}
            aria-label={
              sortNewestFirst
                ? "Sort by oldest issues first"
                : "Sort by newest issues first"
            }
          >
            {sortNewestFirst ? "Newest" : "Oldest"}
            <ArrowDownUp size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="issues-table-header" aria-hidden="true">
          <span>Issue</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Assignee</span>
          <span>Created</span>
        </div>

        <div className="issues-table-body">
          {visibleIssues.map((issue) => (
            <article className="issue-table-row" key={issue.id}>
              <div className="issue-main-cell">
                <KindIcon kind={issue.kind} />
                <div>
                  <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
                  <span>{issue.id}</span>
                </div>
              </div>
              <PriorityBadge priority={issue.priority} />
              <label className={`inline-status status-${issue.status.toLowerCase()}`}>
                <span className="sr-only">Status for {issue.id}</span>
                <i />
                <select
                  value={issue.status}
                  onChange={(event) =>
                    updateStatus(issue.id, event.target.value as IssueStatus)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="assignee-cell">
                <span className="avatar">{initials(issue.assignee)}</span>
                <span>{issue.assignee}</span>
              </div>
              <time dateTime={issue.createdAt}>{formatDate(issue.createdAt)}</time>
            </article>
          ))}
        </div>

        {visibleIssues.length === 0 && (
          <div className="empty-state">
            <Search size={24} aria-hidden="true" />
            <h2>No matching issues</h2>
            <p>Try changing the search term or active filters.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                resetDemo();
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
