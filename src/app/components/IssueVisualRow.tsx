import Link from "next/link";
import type { Issue } from "../data/issues";
import { KindIcon, PriorityBadge, StatusBadge } from "./IssueVisuals";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function IssueVisualRow({
  issue,
  compact = false,
}: {
  issue: Issue;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "issue-visual-row compact" : "issue-visual-row"}>
      <KindIcon kind={issue.kind} />
      <div className="issue-title-cell">
        <Link href={`/issues/${issue.id}`}>{issue.title}</Link>
        <span>{issue.id}</span>
      </div>
      {!compact && <PriorityBadge priority={issue.priority} />}
      <StatusBadge status={issue.status} />
      <span className="avatar" title={issue.assignee}>
        {issue.assignee === "Unassigned"
          ? "?"
          : issue.assignee
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)}
      </span>
      <time dateTime={issue.createdAt}>{formatDate(issue.createdAt)}</time>
    </div>
  );
}
