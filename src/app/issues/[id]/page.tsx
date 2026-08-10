"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CirclePlus,
  FilePenLine,
  Hash,
  MessageSquare,
  Pencil,
  RefreshCcw,
  Repeat2,
  Send,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useIssues } from "../../IssueProvider";
import { authClient } from "../../../lib/auth-client";
import {
  KIND_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Cycle,
  type Issue,
  type IssueActivity,
  type IssueEstimate,
  type IssueKind,
  type IssuePriority,
  type IssueStatus,
  type IssueUpdates,
  type WorkspaceLabel,
  type WorkspaceMember,
} from "../../data/issues";
import { formatCycleDateRange } from "../../data/cycles";
import { stripHtml } from "../../data/richText";
import {
  KindIcon,
  PriorityBadge,
  StatusBadge,
} from "../../components/IssueVisuals";
import { WorkspaceLoading } from "../../components/WorkspaceLoading";
import { IssueLabelChip } from "../../components/IssueLabelChip";
import { RichTextEditor } from "../../components/RichTextEditor";
import { DescriptionView } from "../../components/DescriptionView";
import { MentionTextarea } from "../../components/MentionTextarea";
import { CommentBody } from "../../components/CommentBody";

const ESTIMATES: IssueEstimate[] = [1, 2, 3, 5, 8];

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

function ActivityIcon({ type }: { type: IssueActivity["type"] }) {
  let Icon = RefreshCcw;

  if (type === "CREATED") Icon = CirclePlus;
  if (type === "COMMENT_ADDED") Icon = MessageSquare;
  if (type === "ASSIGNEE_CHANGED") Icon = UserRound;
  if (type === "CONTENT_UPDATED") Icon = FilePenLine;
  if (type === "DUE_DATE_CHANGED") Icon = CalendarDays;
  if (type === "CYCLE_CHANGED") Icon = Repeat2;
  if (type === "ESTIMATE_CHANGED") Icon = Hash;
  if (
    type === "TYPE_CHANGED" ||
    type === "PRIORITY_CHANGED" ||
    type === "LABELS_CHANGED"
  ) {
    Icon = Tag;
  }

  return (
    <span className={`activity-icon activity-${type.toLowerCase()}`}>
      <Icon size={14} aria-hidden="true" />
    </span>
  );
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
  const { issues, labels, cycles, members, isLoading, addComment, updateIssue } =
    useIssues();
  const id = decodeURIComponent(params.id);
  const issue = issues.find((candidate) => candidate.id === id);

  if (isLoading) {
    return <WorkspaceLoading label="issue" />;
  }

  if (!issue) {
    return <IssueNotFound id={id} />;
  }

  return (
    <IssueDetail
      issue={issue}
      labels={labels}
      cycles={cycles}
      members={members}
      onAddComment={addComment}
      onUpdateIssue={updateIssue}
    />
  );
}

function IssueDetail({
  issue,
  labels,
  cycles,
  members,
  onAddComment,
  onUpdateIssue,
}: {
  issue: Issue;
  labels: WorkspaceLabel[];
  cycles: Cycle[];
  members: WorkspaceMember[];
  onAddComment: (issueId: string, body: string) => Promise<boolean>;
  onUpdateIssue: (
    issueId: string,
    updates: IssueUpdates,
  ) => Promise<boolean>;
}) {
  const { data: session } = authClient.useSession();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";
  const currentUserInitials = session?.user.name
    ? getInitials(session.user.name)
    : "?";
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [draftTitle, setDraftTitle] = useState(issue.title);
  const [draftDescription, setDraftDescription] = useState(issue.description);
  const comments = issue.comments ?? [];
  const activity = [...(issue.activity ?? [])].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const canSave =
    draftTitle.trim().length >= 4 &&
    stripHtml(draftDescription).length >= 12;

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = comment.trim();
    if (body.length < 2) return;

    setIsCommenting(true);
    const saved = await onAddComment(issue.id, body);
    if (saved) setComment("");
    setIsCommenting(false);
  };

  const startEditing = () => {
    setDraftTitle(issue.title);
    setDraftDescription(issue.description);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftTitle(issue.title);
    setDraftDescription(issue.description);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!canSave) return;
    setIsSaving(true);
    const saved = await onUpdateIssue(issue.id, {
      title: draftTitle.trim(),
      description: draftDescription,
    });
    if (saved) setIsEditing(false);
    setIsSaving(false);
  };

  return (
    <div className="page detail-page">
      <Link className="back-link" href="/issues">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to issues
      </Link>

      <header className="detail-header">
        <div className="detail-header-top">
          <div className="detail-identity">
            <KindIcon kind={issue.kind} />
            <span>{issue.id}</span>
            <span aria-hidden="true">/</span>
            <span>{KIND_LABELS[issue.kind]}</span>
          </div>
          <div className="detail-actions">
            {isEditing ? (
              <>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={cancelEditing}
                >
                  <X size={15} aria-hidden="true" />
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void saveEditing()}
                  disabled={!canSave || isSaving}
                >
                  <Check size={15} aria-hidden="true" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              !isViewer && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={startEditing}
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit
                </button>
              )
            )}
          </div>
        </div>
        {isEditing ? (
          <label className="detail-title-field">
            <span className="sr-only">Issue title</span>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              maxLength={255}
            />
          </label>
        ) : (
          <h1>{issue.title}</h1>
        )}
        <div className="detail-summary">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          <span>
            <UserRound size={14} aria-hidden="true" />
            {issue.assignee?.name ?? "Unassigned"}
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
            {isEditing ? (
              <label className="detail-description-field">
                <span className="sr-only">Issue description</span>
                <RichTextEditor
                  value={draftDescription}
                  onChange={setDraftDescription}
                  members={members}
                />
              </label>
            ) : (
              <DescriptionView value={issue.description} />
            )}
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
                    <CommentBody body={item.body} />
                  </div>
                </article>
              ))}
            </div>

            {!isViewer && (
              <form className="comment-form" onSubmit={handleComment}>
                <span className="avatar avatar-green">{currentUserInitials}</span>
                <label>
                  <span className="sr-only">Add a comment</span>
                  <MentionTextarea
                    value={comment}
                    onChange={setComment}
                    members={members}
                    placeholder="Add context, an update, or a question... Type @ to mention someone."
                    rows={3}
                    maxLength={1000}
                  />
                </label>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={comment.trim().length < 2 || isCommenting}
                >
                  <Send size={15} aria-hidden="true" />
                  {isCommenting ? "Posting..." : "Comment"}
                </button>
              </form>
            )}
          </section>

          <section className="panel activity-panel">
            <div className="panel-header">
              <div>
                <h2>Activity</h2>
                <p>Complete history for this issue</p>
              </div>
            </div>
            <div className="activity-list">
              {activity.map((event) => (
                <article className="activity-item" key={event.id}>
                  <ActivityIcon type={event.type} />
                  <div>
                    <p>
                      <strong>{event.actor}</strong> {event.description}
                    </p>
                    <time dateTime={event.createdAt}>
                      {formatCommentDate(event.createdAt)}
                    </time>
                  </div>
                </article>
              ))}
            </div>
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
              <label className="editable-property">
                <span className={`property-dot status-${issue.status.toLowerCase()}`} />
                <span className="sr-only">Issue status</span>
                <select
                  value={issue.status}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      status: event.target.value as IssueStatus,
                    })
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Priority">
              <label className="editable-property">
                <span className={`property-dot priority-${issue.priority.toLowerCase()}`} />
                <span className="sr-only">Issue priority</span>
                <select
                  value={issue.priority}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      priority: event.target.value as IssuePriority,
                    })
                  }
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Type">
              <label className="editable-property property-kind">
                <KindIcon kind={issue.kind} />
                <span className="sr-only">Issue type</span>
                <select
                  value={issue.kind}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      kind: event.target.value as IssueKind,
                    })
                  }
                >
                  {Object.entries(KIND_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Assignee">
              <label className="editable-property property-person">
                <span className="avatar">
                  {issue.assignee ? getInitials(issue.assignee.name) : "?"}
                </span>
                <span className="sr-only">Issue assignee</span>
                <select
                  value={issue.assignee?.id ?? ""}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      assigneeId: event.target.value || null,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Due date">
              <label className="editable-date">
                <CalendarDays size={14} aria-hidden="true" />
                <span className="sr-only">Issue due date</span>
                <input
                  type="date"
                  value={issue.dueDate?.slice(0, 10) ?? ""}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      dueDate: event.target.value || null,
                    })
                  }
                />
              </label>
            </IssueProperty>
            <IssueProperty label="Cycle">
              <label className="editable-property">
                <Repeat2 size={14} aria-hidden="true" />
                <span className="sr-only">Issue cycle</span>
                <select
                  value={issue.cycleId ?? ""}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      cycleId: event.target.value || null,
                    })
                  }
                >
                  <option value="">No cycle</option>
                  {cycles
                    .filter((cycle) => cycle.projectId === issue.projectId)
                    .map((cycle) => (
                    <option value={cycle.id} key={cycle.id}>
                      {cycle.name} - {formatCycleDateRange(cycle)}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Estimate">
              <label className="editable-property">
                <Hash size={14} aria-hidden="true" />
                <span className="sr-only">Issue estimate</span>
                <select
                  value={issue.estimate ?? ""}
                  disabled={isViewer}
                  onChange={(event) =>
                    onUpdateIssue(issue.id, {
                      estimate: event.target.value
                        ? (Number(event.target.value) as IssueEstimate)
                        : null,
                    })
                  }
                >
                  <option value="">No estimate</option>
                  {ESTIMATES.map((value) => (
                    <option value={value} key={value}>
                      {value} {value === 1 ? "point" : "points"}
                    </option>
                  ))}
                </select>
              </label>
            </IssueProperty>
            <IssueProperty label="Labels">
              <div className="property-label-options">
                {labels.map((label) => {
                  const checked = issue.labels.some(
                    (issueLabel) => issueLabel.id === label.id,
                  );

                  return (
                    <label key={label.id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isViewer}
                        onChange={(event) => {
                          const currentIds = issue.labels.map(
                            (issueLabel) => issueLabel.id,
                          );
                          void onUpdateIssue(issue.id, {
                            labelIds: event.target.checked
                              ? [...currentIds, label.id]
                              : currentIds.filter((id) => id !== label.id),
                          });
                        }}
                      />
                      <IssueLabelChip label={label} compact />
                    </label>
                  );
                })}
              </div>
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
