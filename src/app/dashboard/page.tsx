"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  Flame,
  Inbox,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useIssues } from "../IssueProvider";
import { authClient } from "../../lib/auth-client";
import { WorkspaceActivity } from "../components/WorkspaceActivity";
import { WorkspaceLoading } from "../components/WorkspaceLoading";
import {
  findCurrentCycle,
  formatCycleDateRange,
  getCycleMetrics,
} from "../data/cycles";
import type { Issue } from "../data/issues";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function dateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildThroughput(issues: Issue[], now: Date) {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today - (6 - index) * DAY_IN_MS);
    return {
      key: dateKey(date),
      day: new Intl.DateTimeFormat("en", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      opened: 0,
      closed: 0,
    };
  });
  const byDate = new Map(points.map((point) => [point.key, point]));

  for (const issue of issues) {
    const openedPoint = byDate.get(dateKey(issue.createdAt));
    if (openedPoint) openedPoint.opened += 1;

    const completionEvents = (issue.activity ?? []).filter(
      (event) =>
        event.type === "STATUS_CHANGED" &&
        event.description.toLowerCase().endsWith("to done"),
    );

    if (completionEvents.length > 0) {
      for (const event of completionEvents) {
        const closedPoint = byDate.get(dateKey(event.createdAt));
        if (closedPoint) closedPoint.closed += 1;
      }
    } else if (issue.status === "DONE") {
      const closedPoint = byDate.get(dateKey(issue.createdAt));
      if (closedPoint) closedPoint.closed += 1;
    }
  }

  return points;
}

export default function Home() {
  const { issues, cycles, isLoading } = useIssues();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";

  if (isLoading) {
    return <WorkspaceLoading label="overview" />;
  }

  const active = issues.filter((issue) => issue.status !== "DONE").length;
  const inProgress = issues.filter(
    (issue) => issue.status === "IN_PROGRESS",
  ).length;
  const completed = issues.filter((issue) => issue.status === "DONE").length;
  const urgent = issues.filter(
    (issue) => issue.priority === "URGENT" && issue.status !== "DONE",
  ).length;
  const completionRate = Math.round((completed / Math.max(issues.length, 1)) * 100);
  const now = new Date();
  const throughput = buildThroughput(issues, now);
  const largestThroughput = Math.max(
    1,
    ...throughput.flatMap((point) => [point.opened, point.closed]),
  );
  const addedThisWeek = throughput.reduce(
    (total, point) => total + point.opened,
    0,
  );
  const activeOwners = new Set(
    issues
      .filter((issue) => issue.status !== "DONE" && issue.assignee !== null)
      .map((issue) => issue.assignee?.id),
  ).size;
  const currentCycle = findCurrentCycle(cycles, now);
  const cycleMetrics = currentCycle
    ? getCycleMetrics(currentCycle, issues, now)
    : null;

  const priorityCounts = [
    {
      label: "Urgent",
      value: issues.filter((issue) => issue.priority === "URGENT").length,
      color: "var(--red-500)",
    },
    {
      label: "High",
      value: issues.filter((issue) => issue.priority === "HIGH").length,
      color: "var(--amber-500)",
    },
    {
      label: "Medium",
      value: issues.filter((issue) => issue.priority === "MEDIUM").length,
      color: "var(--blue-500)",
    },
    {
      label: "Low / none",
      value: issues.filter(
        (issue) =>
          issue.priority === "LOW" || issue.priority === "NO_PRIORITY",
      ).length,
      color: "var(--gray-400)",
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace status // Live</p>
          <h1>Mission control</h1>
          <p className="page-description">
            Clear the queue, protect the cycle, and ship what matters.
          </p>
        </div>
        {!isViewer && (
          <Link className="primary-button" href="/issues/new">
            <Plus size={16} aria-hidden="true" />
            New issue
          </Link>
        )}
      </header>

      <section className="metrics-grid" aria-label="Workspace summary">
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue">
            <Inbox size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Active issues</span>
          <strong className="metric-value">{active}</strong>
          <span className="metric-note">
            <TrendingUp size={14} aria-hidden="true" />
            {addedThisWeek} added this week
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">In progress</span>
          <strong className="metric-value">{inProgress}</strong>
          <span className="metric-note neutral">
            Across {activeOwners} {activeOwners === 1 ? "owner" : "owners"}
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green">
            <CircleCheck size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Completion rate</span>
          <strong className="metric-value">{completionRate}%</strong>
          <span className="metric-note positive">
            {completed} of {issues.length} issues
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-red">
            <Flame size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Urgent</span>
          <strong className="metric-value">{urgent}</strong>
          <span className="metric-note neutral">Needs attention today</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel throughput-panel">
          <div className="panel-header">
            <div>
              <h2>Work pulse</h2>
              <p>Issues opened and completed over the last 7 days</p>
            </div>
            <div className="chart-legend" aria-label="Chart legend">
              <span><i className="legend-opened" />Opened</span>
              <span><i className="legend-closed" />Completed</span>
            </div>
          </div>
          <div className="bar-chart" aria-label="Weekly issue throughput chart">
            {throughput.map((point) => (
              <div className="bar-group" key={point.day}>
                <div className="bars">
                  <span
                    className="bar bar-opened"
                    style={{
                      height: `${Math.max(
                        4,
                        (point.opened / largestThroughput) * 84,
                      )}px`,
                    }}
                    title={`${point.opened} opened`}
                  />
                  <span
                    className="bar bar-closed"
                    style={{
                      height: `${Math.max(
                        4,
                        (point.closed / largestThroughput) * 84,
                      )}px`,
                    }}
                    title={`${point.closed} completed`}
                  />
                </div>
                <small>{point.day}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel cycle-panel">
          {currentCycle && cycleMetrics ? (
            <>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{currentCycle.name}</p>
                  <h2>{formatCycleDateRange(currentCycle)}</h2>
                </div>
                <span className="cycle-day">
                  Day {cycleMetrics.elapsedDays} of {cycleMetrics.totalDays}
                </span>
              </div>
              <div
                className="progress-ring"
                style={
                  {
                    "--progress": `${cycleMetrics.completionPercent}%`,
                  } as React.CSSProperties
                }
              >
                <span>
                  <strong>{cycleMetrics.completionPercent}%</strong>
                  <small>complete</small>
                </span>
              </div>
              <div className="cycle-stats">
                <span>
                  <strong>{cycleMetrics.completedPoints}</strong>
                  <small>Completed</small>
                </span>
                <span>
                  <strong>{cycleMetrics.remainingPoints}</strong>
                  <small>Remaining</small>
                </span>
                <span>
                  <strong>{cycleMetrics.atRisk}</strong>
                  <small>At risk</small>
                </span>
              </div>
              <div
                className="linear-progress"
                aria-label={`Cycle is ${cycleMetrics.completionPercent}% complete`}
              >
                <span
                  style={{ width: `${cycleMetrics.completionPercent}%` }}
                />
              </div>
              <Link className="cycle-panel-link" href="/cycles">
                View cycle plan <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <div className="cycle-panel-empty">
              <Clock3 size={22} aria-hidden="true" />
              <h2>No active cycle</h2>
              <Link className="text-link" href="/cycles">
                Open cycle planning
              </Link>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h2>Workspace activity</h2>
              <p>Recent changes across every issue</p>
            </div>
            <Link className="text-link" href="/issues">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <WorkspaceActivity issues={issues} />
        </article>

        <article className="panel priority-panel">
          <div className="panel-header">
            <div>
              <h2>Priority mix</h2>
              <p>All issues by priority</p>
            </div>
          </div>
          <div className="priority-stack">
            {priorityCounts.map((priority) => {
              const percentage = Math.round(
                (priority.value / Math.max(issues.length, 1)) * 100,
              );
              return (
                <div className="priority-row" key={priority.label}>
                  <span>
                    <i style={{ background: priority.color }} />
                    {priority.label}
                  </span>
                  <div className="priority-bar">
                    <i
                      style={{
                        width: `${percentage}%`,
                        background: priority.color,
                      }}
                    />
                  </div>
                  <strong>{priority.value}</strong>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
