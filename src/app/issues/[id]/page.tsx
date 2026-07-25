"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, MessageSquare, Send, UserRound } from "lucide-react";
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

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
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
  const { issues, addComment } = useIssues();
  const id = decodeURIComponent(params.id);
  const issue = issues.find((candidate) => candidate.id === id);

  if (!issue) {
    return <IssueNotFound id={id} />;
  }

  return <IssueDetail issue={issue} onAddComment={addComment} />;
}

function IssueDetail({
  issue,
  onAddComment,
}: {
  issue: Issue;
  onAddComment: (issueId: string, body: string) => unknown;
}) {
  const [comment, setComment] = useState("");
  const comments = issue.comments ?? [];

  const handleComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = comment.trim();
    if (body.length < 2) return;

    onAddComment(issue.id, body);
    setComment("");
  };

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
        <div className="detail-main-column">
          <section className="panel description-panel">
            <div className="panel-header">
              <div>
                <h2>Description</h2>
                <p>Context and expected outcome for this issue</p>
              </div>
            </div>
            <p className="issue-description">{issue.description}</p>
          </section>

          <section className="panel comments-panel">
            <div className="panel-header">
              <div>
                <h2>Discussion</h2>
                <p>
                  {comments.length === 0
                    ? "No comments yet"
                    : `${comments.length} ${
                        comments.length === 1 ? "comment" : "comments"
                      }`}
                </p>
              </div>
              <MessageSquare size={17} aria-hidden="true" />
            </div>

            <div className="comment-list">
              {comments.map((item) => (
                <article className="comment" key={item.id}>
                  <span className="avatar">{getInitials(item.author)}</span>
                  <div>
                    <header>
                      <strong>{item.author}</strong>
                      <time dateTime={item.createdAt}>
                        {formatCommentDate(item.createdAt)}
                      </time>
                    </header>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <form className="comment-form" onSubmit={handleComment}>
              <span className="avatar avatar-green">AR</span>
              <label>
                <span className="sr-only">Add a comment</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add context, an update, or a question..."
                  rows={3}
                  maxLength={1000}
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={comment.trim().length < 2}
              >
                <Send size={15} aria-hidden="true" />
                Comment
              </button>
            </form>
          </section>
        </div>

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
                    : getInitials(issue.assignee)}
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
