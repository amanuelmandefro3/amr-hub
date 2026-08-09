"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CircleCheck,
  Gauge,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { useIssues } from "../IssueProvider";
import { authClient } from "../../lib/auth-client";
import { PriorityBadge, StatusBadge } from "../components/IssueVisuals";
import { WorkspaceLoading } from "../components/WorkspaceLoading";
import {
  findCurrentCycle,
  formatCycleDateRange,
  getCycleMetrics,
  getCyclePhase,
  type CyclePhase,
} from "../data/cycles";

const PHASE_LABELS: Record<CyclePhase, string> = {
  past: "Completed",
  current: "Current",
  upcoming: "Upcoming",
};

export default function CyclesPage() {
  const { cycles, issues, isLoading } = useIssues();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";
  const now = new Date();

  if (isLoading) {
    return <WorkspaceLoading label="cycles" />;
  }

  const activeCycle = findCurrentCycle(cycles, now);
  const activeMetrics = activeCycle
    ? getCycleMetrics(activeCycle, issues, now)
    : null;
  const unscheduled = issues.filter((issue) => issue.cycleId === null);

  return (
    <div className="page cycles-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Delivery planning</p>
          <h1>Cycles</h1>
          <p className="page-description">
            Balance scope against capacity and keep committed work visible.
          </p>
        </div>
        {!isViewer && (
          <Link className="primary-button" href="/issues/new">
            <Plus size={16} aria-hidden="true" />
            New issue
          </Link>
        )}
      </header>

      {activeCycle && activeMetrics ? (
        <>
          <section
            className="cycle-focus"
            aria-labelledby="current-cycle-heading"
          >
            <div className="cycle-focus-heading">
              <div>
                <span className="cycle-phase current">Current cycle</span>
                <h2 id="current-cycle-heading">{activeCycle.name}</h2>
                <p>{formatCycleDateRange(activeCycle)}</p>
              </div>
              <span className="cycle-day">
                Day {activeMetrics.elapsedDays} of {activeMetrics.totalDays}
              </span>
            </div>
            <div className="cycle-focus-metrics">
              <div>
                <Gauge size={17} aria-hidden="true" />
                <span>
                  <strong>
                    {activeMetrics.plannedPoints} / {activeCycle.capacity}
                  </strong>
                  <small>Points planned</small>
                </span>
              </div>
              <div>
                <CircleCheck size={17} aria-hidden="true" />
                <span>
                  <strong>{activeMetrics.completedPoints}</strong>
                  <small>Points completed</small>
                </span>
              </div>
              <div>
                <TriangleAlert size={17} aria-hidden="true" />
                <span>
                  <strong>{activeMetrics.atRisk}</strong>
                  <small>Issues at risk</small>
                </span>
              </div>
              <div>
                <CalendarRange size={17} aria-hidden="true" />
                <span>
                  <strong>{unscheduled.length}</strong>
                  <small>Unscheduled issues</small>
                </span>
              </div>
            </div>
            <div className="capacity-track">
              <span
                className={
                  activeMetrics.capacityPercent > 100 ? "over-capacity" : ""
                }
                style={{
                  width: `${Math.min(activeMetrics.capacityPercent, 100)}%`,
                }}
              />
            </div>
            <p className="capacity-note">
              {activeMetrics.capacityPercent}% of available capacity planned
              {activeMetrics.unestimated > 0
                ? `, with ${activeMetrics.unestimated} unestimated`
                : ""}
            </p>
          </section>

          <section className="panel cycle-scope-panel">
            <div className="panel-header">
              <div>
                <h2>Current scope</h2>
                <p>
                  {activeMetrics.issues.length} scheduled issues with{" "}
                  {activeMetrics.remainingPoints} points remaining
                </p>
              </div>
              <Link className="text-link" href="/issues">
                All issues <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="cycle-scope-list">
              {activeMetrics.issues.map((issue) => (
                <div className="cycle-scope-row" key={issue.id}>
                  <div>
                    <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
                    <span>{issue.id}</span>
                  </div>
                  <PriorityBadge priority={issue.priority} />
                  <StatusBadge status={issue.status} />
                  <span className="estimate-chip">
                    {issue.estimate ?? "-"} pts
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="panel cycle-empty">
          <CalendarRange size={22} aria-hidden="true" />
          <h2>No cycle is scheduled</h2>
          <p>Add a cycle to start planning delivery capacity.</p>
        </section>
      )}

      <section className="cycle-history" aria-labelledby="cycle-history-heading">
        <div className="section-heading">
          <div>
            <h2 id="cycle-history-heading">Cycle timeline</h2>
            <p>Compare recent delivery and upcoming capacity.</p>
          </div>
        </div>
        <div className="cycle-card-grid">
          {cycles.map((cycle) => {
            const phase = getCyclePhase(cycle, now);
            const metrics = getCycleMetrics(cycle, issues, now);

            return (
              <article className="cycle-card" key={cycle.id}>
                <header>
                  <span className={`cycle-phase ${phase}`}>
                    {PHASE_LABELS[phase]}
                  </span>
                  <span>{formatCycleDateRange(cycle)}</span>
                </header>
                <h3>{cycle.name}</h3>
                <div className="cycle-card-total">
                  <strong>{metrics.plannedPoints}</strong>
                  <span>of {cycle.capacity} points planned</span>
                </div>
                <div className="capacity-track">
                  <span
                    className={
                      metrics.capacityPercent > 100 ? "over-capacity" : ""
                    }
                    style={{
                      width: `${Math.min(metrics.capacityPercent, 100)}%`,
                    }}
                  />
                </div>
                <footer>
                  <span>{metrics.completedPoints} completed</span>
                  <span>{metrics.issues.length} issues</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
