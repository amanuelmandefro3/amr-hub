import type { Issue, IssueActivityType } from "./issues";

export type WorkspaceActivityItem = {
  id: string;
  issueId: string;
  issueTitle: string;
  type: IssueActivityType;
  description: string;
  actor: string | null;
  createdAt: string;
};

export function buildWorkspaceActivity(issues: Issue[], limit = 6) {
  const activity = issues.flatMap<WorkspaceActivityItem>((issue) => {
    const recorded = (issue.activity ?? []).map((event) => ({
      id: event.id,
      issueId: issue.id,
      issueTitle: issue.title,
      type: event.type,
      description: event.description,
      actor: event.actor,
      createdAt: event.createdAt,
    }));
    const hasCreatedEvent = recorded.some((event) => event.type === "CREATED");

    if (hasCreatedEvent) return recorded;

    return [
      ...recorded,
      {
        id: `${issue.id}-created`,
        issueId: issue.id,
        issueTitle: issue.title,
        type: "CREATED" as const,
        description: "Issue created",
        actor: null,
        createdAt: issue.createdAt,
      },
    ];
  });

  return activity
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, Math.max(0, limit));
}

export function formatActivityTime(value: string, now = new Date()) {
  const date = new Date(value);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000),
  );

  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 60 * 60) {
    return `${Math.floor(elapsedSeconds / 60)}m ago`;
  }
  if (elapsedSeconds < 24 * 60 * 60) {
    return `${Math.floor(elapsedSeconds / (60 * 60))}h ago`;
  }
  if (elapsedSeconds < 7 * 24 * 60 * 60) {
    return `${Math.floor(elapsedSeconds / (24 * 60 * 60))}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}
