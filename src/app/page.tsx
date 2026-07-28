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
import { useIssues } from "./IssueProvider";
import { IssueVisualRow } from "./components/IssueVisualRow";
import { WorkspaceLoading } from "./components/WorkspaceLoading";
import { MetricCard } from "./components/MetricCard";
import { ThroughputChart } from "./components/ThroughputChart";
import { PriorityRing } from "./components/PriorityRing";
import { ActivityFeed } from "./components/ActivityFeed";
import {
  findCurrentCycle,
  formatCycleDateRange,
  getCycleMetrics,
} from "./data/cycles";
import type { Issue } from "./data/issues";

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
      .filter(
        (issue) =>
          issue.status !== "DONE" && issue.assignee !== "Unassigned",
      )
      .map((issue) => issue.assignee),
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
          <p className="eyebrow">Product engineering</p>
          <h1>Overview</h1>
          <p className="page-description">
            Track the work that needs attention and keep delivery moving.
          </p>
        </div>
        <Link className="primary-button" href="/issues/new">
          <Plus size={16} aria-hidden="true" />
          New issue
        </Link>
      </header>

      <section className="metrics-grid" aria-label="Workspace summary">
        <MetricCard
          icon={<Inbox size={18} aria-hidden="true" />}
          label="Active issues"
          value={active}
          note={
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <TrendingUp size={14} aria-hidden="true" />
              {addedThisWeek} added this week
            </div>
          }
          variant="blue"
        />
        <MetricCard
          icon={<Clock3 size={18} aria-hidden="true" />}
          label="In progress"
          value={inProgress}
          note={`Across ${activeOwners} ${activeOwners === 1 ? "owner" : "owners"}`}
          variant="amber"
        />
        <MetricCard
          icon={<CircleCheck size={18} aria-hidden="true" />}
          label="Completion rate"
          value={`${completionRate}%`}
          note={`${completed} of ${issues.length} issues`}
          variant="green"
        />
        <MetricCard
          icon={<Flame size={18} aria-hidden="true" />}
          label="Urgent"
          value={urgent}
          note="Needs attention today"
          variant="red"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel throughput-panel">
          <div className="panel-header">
            <div>
              <h2>Work pulse</h2>
              <p>Issues opened and completed over the last 7 days</p>
            </div>
          </div>
          <ThroughputChart data={throughput} />
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
              <h2>Latest activity</h2>
              <p>Recent changes across your workspace</p>
            </div>
          </div>
          <ActivityFeed issues={issues} maxItems={6} />
        </article>

        <article className="panel priority-panel">
          <div className="panel-header">
            <div>
              <h2>Priority mix</h2>
              <p>All issues by priority</p>
            </div>
          </div>
          <PriorityRing data={priorityCounts} />
        </article>
      </section>
    </div>
  );
}
