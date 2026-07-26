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

const throughput = [
  { day: "Mon", opened: 3, closed: 2 },
  { day: "Tue", opened: 5, closed: 3 },
  { day: "Wed", opened: 4, closed: 5 },
  { day: "Thu", opened: 7, closed: 4 },
  { day: "Fri", opened: 5, closed: 6 },
  { day: "Sat", opened: 2, closed: 3 },
  { day: "Sun", opened: 4, closed: 5 },
];

export default function Home() {
  const { issues, isLoading } = useIssues();

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
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue">
            <Inbox size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Active issues</span>
          <strong className="metric-value">{active}</strong>
          <span className="metric-note">
            <TrendingUp size={14} aria-hidden="true" />
            3 added this week
          </span>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">In progress</span>
          <strong className="metric-value">{inProgress}</strong>
          <span className="metric-note neutral">Across 2 owners</span>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green">
            <CircleCheck size={18} aria-hidden="true" />
          </span>
          <span className="metric-label">Completion rate</span>
          <strong className="metric-value">{completionRate}%</strong>
          <span className="metric-note positive">+8% from last week</span>
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
                    style={{ height: `${point.opened * 12}px` }}
                    title={`${point.opened} opened`}
                  />
                  <span
                    className="bar bar-closed"
                    style={{ height: `${point.closed * 12}px` }}
                    title={`${point.closed} completed`}
                  />
                </div>
                <small>{point.day}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel cycle-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Current cycle</p>
              <h2>July 22 - Aug 2</h2>
            </div>
            <span className="cycle-day">Day 4 of 10</span>
          </div>
          <div className="progress-ring" style={{ "--progress": "68%" } as React.CSSProperties}>
            <span><strong>68%</strong><small>complete</small></span>
          </div>
          <div className="cycle-stats">
            <span><strong>17</strong><small>Completed</small></span>
            <span><strong>8</strong><small>Remaining</small></span>
            <span><strong>3</strong><small>At risk</small></span>
          </div>
          <div className="linear-progress" aria-label="Cycle is 68% complete">
            <span style={{ width: "68%" }} />
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h2>Recent issues</h2>
              <p>Latest activity across your workspace</p>
            </div>
            <Link className="text-link" href="/issues">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="issue-rows">
            {issues.slice(0, 5).map((issue) => (
              <IssueVisualRow issue={issue} key={issue.id} compact />
            ))}
          </div>
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
