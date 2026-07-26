"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Bookmark,
  BookmarkPlus,
  ListFilter,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useIssues } from "../IssueProvider";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type IssuePriority,
  type IssueStatus,
} from "../data/issues";
import { KindIcon, PriorityBadge } from "../components/IssueVisuals";
import { WorkspaceLoading } from "../components/WorkspaceLoading";
import { IssueLabelChip } from "../components/IssueLabelChip";

type StatusFilter = "ALL" | "ACTIVE" | IssueStatus;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All issues", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Backlog", value: "BACKLOG" },
  { label: "Completed", value: "DONE" },
];

const assignees = ["Amanuel R.", "Maya Chen", "Jon Bell", "Unassigned"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function dueDateState(value: string) {
  const dueDate = new Date(value);
  const today = new Date();
  dueDate.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);
  const daysUntilDue = Math.round(
    (dueDate.getTime() - today.getTime()) / 86_400_000,
  );

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 2) return "due-soon";
  return "scheduled";
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
  const {
    issues,
    labels,
    savedViews,
    isLoading,
    updateStatus,
    createSavedView,
    deleteSavedView,
  } = useIssues();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "ALL">(
    "ALL",
  );
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [labelFilter, setLabelFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [selectedViewId, setSelectedViewId] = useState("");
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [viewError, setViewError] = useState<string | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);

  const visibleIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return issues
      .filter((issue) => {
        const matchesQuery =
          !normalizedQuery ||
          issue.title.toLowerCase().includes(normalizedQuery) ||
          issue.id.toLowerCase().includes(normalizedQuery) ||
          issue.assignee.toLowerCase().includes(normalizedQuery) ||
          issue.labels.some((label) =>
            label.name.toLowerCase().includes(normalizedQuery),
          );
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && issue.status !== "DONE") ||
          issue.status === statusFilter;
        const matchesPriority =
          priorityFilter === "ALL" || issue.priority === priorityFilter;
        const matchesLabel =
          labelFilter === "ALL" ||
          issue.labels.some((label) => label.id === labelFilter);
        const matchesAssignee =
          assigneeFilter === "ALL" || issue.assignee === assigneeFilter;

        return (
          matchesQuery &&
          matchesStatus &&
          matchesPriority &&
          matchesLabel &&
          matchesAssignee
        );
      })
      .sort((left, right) => {
        const difference =
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return sortNewestFirst ? difference : -difference;
      });
  }, [
    issues,
    assigneeFilter,
    labelFilter,
    priorityFilter,
    query,
    sortNewestFirst,
    statusFilter,
  ]);

  const markViewModified = () => setSelectedViewId("");

  const applySavedView = (id: string) => {
    const view = savedViews.find((candidate) => candidate.id === id);
    setSelectedViewId(id);
    if (!view) return;

    setQuery(view.query);
    setStatusFilter(view.status);
    setPriorityFilter(view.priority);
    setAssigneeFilter(view.assignee);
    setLabelFilter(view.labelId ?? "ALL");
    setSortNewestFirst(view.sort === "NEWEST");
  };

  const handleSaveView = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = viewName.trim();
    if (name.length < 2) return;

    setIsSavingView(true);
    setViewError(null);

    try {
      const view = await createSavedView({
        name,
        query: query.trim(),
        status: statusFilter,
        priority: priorityFilter,
        assignee: assigneeFilter,
        sort: sortNewestFirst ? "NEWEST" : "OLDEST",
        labelId: labelFilter === "ALL" ? null : labelFilter,
      });
      setSelectedViewId(view.id);
      setViewName("");
      setIsSaveViewOpen(false);
    } catch (error) {
      setViewError(
        error instanceof Error
          ? error.message
          : "Saved view could not be created",
      );
    } finally {
      setIsSavingView(false);
    }
  };

  const handleDeleteView = async () => {
    if (!selectedViewId) return;
    if (await deleteSavedView(selectedViewId)) setSelectedViewId("");
  };

  if (isLoading) {
    return <WorkspaceLoading label="issues" />;
  }

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

      <div className="saved-views-bar">
        <label>
          <Bookmark size={15} aria-hidden="true" />
          <span className="sr-only">Open a saved view</span>
          <select
            value={selectedViewId}
            onChange={(event) => applySavedView(event.target.value)}
          >
            <option value="">Current filters</option>
            {savedViews.map((view) => (
              <option value={view.id} key={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setViewError(null);
            setIsSaveViewOpen(true);
          }}
        >
          <BookmarkPlus size={15} aria-hidden="true" />
          Save view
        </button>
        {selectedViewId && (
          <button
            className="icon-button danger"
            type="button"
            onClick={() => void handleDeleteView()}
            aria-label="Delete selected saved view"
            title="Delete saved view"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="issue-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Issue status">
          {statusFilters.map((filter) => (
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.value}
              className={statusFilter === filter.value ? "active" : ""}
              onClick={() => {
                setStatusFilter(filter.value);
                markViewModified();
              }}
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
              onChange={(event) => {
                setQuery(event.target.value);
                markViewModified();
              }}
              placeholder="Search issues..."
            />
          </label>
          <label className="select-button">
            <ListFilter size={16} aria-hidden="true" />
            <span className="sr-only">Filter by priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(
                  event.target.value as IssuePriority | "ALL",
                );
                markViewModified();
              }}
            >
              <option value="ALL">All priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="select-button">
            <Tag size={16} aria-hidden="true" />
            <span className="sr-only">Filter by label</span>
            <select
              value={labelFilter}
              onChange={(event) => {
                setLabelFilter(event.target.value);
                markViewModified();
              }}
            >
              <option value="ALL">All labels</option>
              {labels.map((label) => (
                <option value={label.id} key={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </label>
          <label className="select-button">
            <UserRound size={16} aria-hidden="true" />
            <span className="sr-only">Filter by assignee</span>
            <select
              value={assigneeFilter}
              onChange={(event) => {
                setAssigneeFilter(event.target.value);
                markViewModified();
              }}
            >
              <option value="ALL">All assignees</option>
              {assignees.map((assignee) => (
                <option value={assignee} key={assignee}>
                  {assignee}
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
            onClick={() => {
              setSortNewestFirst((current) => !current);
              markViewModified();
            }}
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
          <span>Due</span>
        </div>

        <div className="issues-table-body">
          {visibleIssues.map((issue) => (
            <article className="issue-table-row" key={issue.id}>
              <div className="issue-main-cell">
                <KindIcon kind={issue.kind} />
                <div>
                  <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
                  <div className="issue-row-meta">
                    <span>{issue.id}</span>
                    {issue.labels.slice(0, 2).map((label) => (
                      <IssueLabelChip label={label} compact key={label.id} />
                    ))}
                  </div>
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
              {issue.dueDate ? (
                <time
                  className={`issue-due-date ${dueDateState(issue.dueDate)}`}
                  dateTime={issue.dueDate}
                >
                  {formatDate(issue.dueDate)}
                </time>
              ) : (
                <span className="issue-no-due-date">No date</span>
              )}
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
                setLabelFilter("ALL");
                setAssigneeFilter("ALL");
                setSelectedViewId("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {isSaveViewOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setIsSaveViewOpen(false);
            }
          }}
        >
          <section
            className="save-view-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-view-title"
          >
            <header>
              <div>
                <h2 id="save-view-title">Save current view</h2>
                <p>Reuse this filter combination across the workspace.</p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsSaveViewOpen(false)}
                aria-label="Close save view dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <form onSubmit={handleSaveView}>
              <label className="form-field">
                <span>View name</span>
                <input
                  value={viewName}
                  onChange={(event) => {
                    setViewName(event.target.value);
                    setViewError(null);
                  }}
                  maxLength={50}
                  placeholder="e.g. Support triage"
                  autoFocus
                />
              </label>
              {viewError && (
                <p className="form-submit-error" role="alert">
                  {viewError}
                </p>
              )}
              <footer>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsSaveViewOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={viewName.trim().length < 2 || isSavingView}
                >
                  <BookmarkPlus size={15} aria-hidden="true" />
                  {isSavingView ? "Saving..." : "Save view"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
