"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { useIssues } from "../../IssueProvider";
import {
  KIND_LABELS,
  type Issue,
} from "../../data/issues";
import {
  KindIcon,
  PriorityBadge,
  StatusBadge,
} from "../../components/IssueVisuals";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function IssueProperty({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="issue-property">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function IssueNotFound({ id }: { id: string }) {
  return (
    <div className="page detail-page">
      <Link className="back-link" href="/issues">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to issues
      </Link>
      <section className="detail-empty">
        <span>{id || "Unknown issue"}</span>
        <h1>Issue not found</h1>
        <p>
          This issue may have been removed or belongs to a different workspace.
        </p>
        <Link className="primary-button" href="/issues">
          View all issues
        </Link>
      </section>
    </div>
  );
}

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const { issues } = useIssues();
  const id = decodeURIComponent(params.id);
  const issue = issues.find((candidate) => candidate.id === id);

  if (!issue) {
    return <IssueNotFound id={id} />;
  }

  return <IssueDetail issue={issue} />;
}

function IssueDetail({ issue }: { issue: Issue }) {
  return (
    <div className="page detail-page">
      <Link className="back-link" href="/issues">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to issues
      </Link>

      <header className="detail-header">
        <div className="detail-identity">
          <KindIcon kind={issue.kind} />
          <span>{issue.id}</span>
          <span aria-hidden="true">/</span>
          <span>{KIND_LABELS[issue.kind]}</span>
        </div>
        <h1>{issue.title}</h1>
        <div className="detail-summary">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          <span>
            <UserRound size={14} aria-hidden="true" />
            {issue.assignee}
          </span>
        </div>
      </header>

      <div className="detail-layout">
        <section className="panel description-panel">
          <div className="panel-header">
            <div>
              <h2>Description</h2>
              <p>Context and expected outcome for this issue</p>
            </div>
          </div>
          <p className="issue-description">{issue.description}</p>
        </section>

        <aside className="panel properties-panel" aria-label="Issue properties">
          <div className="panel-header">
            <div>
              <h2>Properties</h2>
              <p>Planning and ownership</p>
            </div>
          </div>
          <div className="property-list">
            <IssueProperty label="Status">
              <StatusBadge status={issue.status} />
            </IssueProperty>
            <IssueProperty label="Priority">
              <PriorityBadge priority={issue.priority} />
            </IssueProperty>
            <IssueProperty label="Type">
              <span className="property-kind">
                <KindIcon kind={issue.kind} />
                {KIND_LABELS[issue.kind]}
              </span>
            </IssueProperty>
            <IssueProperty label="Assignee">
              <span className="property-person">
                <span className="avatar">
                  {issue.assignee === "Unassigned"
                    ? "?"
                    : issue.assignee
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                </span>
                {issue.assignee}
              </span>
            </IssueProperty>
            <IssueProperty label="Created">
              <span className="property-date">
                <CalendarDays size={14} aria-hidden="true" />
                {formatDate(issue.createdAt)}
              </span>
            </IssueProperty>
          </div>
        </aside>
      </div>
    </div>
  );
}
