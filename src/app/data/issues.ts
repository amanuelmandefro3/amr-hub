export type IssueStatus = "BACKLOG" | "OPEN" | "IN_PROGRESS" | "DONE";
export type IssuePriority =
  | "NO_PRIORITY"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";
export type IssueKind = "BUG" | "FEATURE" | "TASK";

export type IssueComment = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
};

export type IssueActivityType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "TYPE_CHANGED"
  | "CONTENT_UPDATED"
  | "COMMENT_ADDED"
  | "DUE_DATE_CHANGED"
  | "LABELS_CHANGED";

export type IssueActivity = {
  id: string;
  type: IssueActivityType;
  description: string;
  actor: string;
  createdAt: string;
};

export type WorkspaceLabel = {
  id: string;
  name: string;
  color: string;
};

export type SavedViewStatus = "ALL" | "ACTIVE" | IssueStatus;
export type SavedViewPriority = "ALL" | IssuePriority;
export type SavedViewSort = "NEWEST" | "OLDEST";

export type SavedView = {
  id: string;
  name: string;
  owner: string;
  query: string;
  status: SavedViewStatus;
  priority: SavedViewPriority;
  assignee: string;
  sort: SavedViewSort;
  labelId: string | null;
};

export type SavedViewInput = Omit<SavedView, "id" | "owner">;

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  kind: IssueKind;
  assignee: string;
  dueDate: string | null;
  labels: WorkspaceLabel[];
  createdAt: string;
  comments?: IssueComment[];
  activity?: IssueActivity[];
};

export type NewIssueInput = Pick<
  Issue,
  "title" | "description" | "priority" | "kind" | "assignee"
> & {
  dueDate: string | null;
  labelIds: string[];
};

export type IssueUpdates = Partial<
  Pick<
    Issue,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "kind"
    | "assignee"
    | "dueDate"
  >
> & {
  labelIds?: string[];
};

export const WORKSPACE_LABELS: WorkspaceLabel[] = [
  { id: "label-customer", name: "Customer impact", color: "#dc2626" },
  { id: "label-frontend", name: "Frontend", color: "#2563eb" },
  { id: "label-backend", name: "Backend", color: "#059669" },
  { id: "label-reliability", name: "Reliability", color: "#d97706" },
  { id: "label-design", name: "Design", color: "#7c3aed" },
];

export const DEMO_ISSUES: Issue[] = [
  {
    id: "AMR-128",
    title: "Checkout stalls after applying a promo code",
    description:
      "The checkout request occasionally remains pending when a valid promo code is applied.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    kind: "BUG",
    assignee: "Amanuel R.",
    dueDate: "2026-07-27T12:00:00.000Z",
    labels: [WORKSPACE_LABELS[0], WORKSPACE_LABELS[2]],
    createdAt: "2026-07-25T07:20:00.000Z",
    comments: [
      {
        id: "comment-128-1",
        body: "I can reproduce this consistently when the promotion reduces the order total below the free-shipping threshold.",
        author: "Maya Chen",
        createdAt: "2026-07-25T08:05:00.000Z",
      },
      {
        id: "comment-128-2",
        body: "I am checking the shipping recalculation path and will add a regression test with the fix.",
        author: "Amanuel R.",
        createdAt: "2026-07-25T09:10:00.000Z",
      },
    ],
  },
  {
    id: "AMR-127",
    title: "Add saved views for support triage",
    description:
      "Let support leads save combinations of status, priority, and assignee filters.",
    status: "OPEN",
    priority: "HIGH",
    kind: "FEATURE",
    assignee: "Maya Chen",
    dueDate: "2026-07-30T12:00:00.000Z",
    labels: [WORKSPACE_LABELS[1]],
    createdAt: "2026-07-24T13:40:00.000Z",
  },
  {
    id: "AMR-126",
    title: "Improve empty state for new workspaces",
    description:
      "Guide first-time teams toward creating and assigning their first issue.",
    status: "DONE",
    priority: "MEDIUM",
    kind: "TASK",
    assignee: "Jon Bell",
    dueDate: null,
    labels: [],
    createdAt: "2026-07-24T08:10:00.000Z",
  },
  {
    id: "AMR-125",
    title: "Mobile navigation overlaps issue actions",
    description:
      "The primary action is partially hidden on narrow screens with browser zoom enabled.",
    status: "OPEN",
    priority: "HIGH",
    kind: "BUG",
    assignee: "Amanuel R.",
    dueDate: "2026-07-28T12:00:00.000Z",
    labels: [WORKSPACE_LABELS[1], WORKSPACE_LABELS[3]],
    createdAt: "2026-07-23T15:25:00.000Z",
    comments: [
      {
        id: "comment-125-1",
        body: "Confirmed at 200% browser zoom on a 390px viewport.",
        author: "Jon Bell",
        createdAt: "2026-07-23T16:10:00.000Z",
      },
    ],
  },
  {
    id: "AMR-124",
    title: "Define SLA labels for customer-impacting bugs",
    description:
      "Document and add labels for response-time targets by severity.",
    status: "BACKLOG",
    priority: "MEDIUM",
    kind: "TASK",
    assignee: "Unassigned",
    dueDate: "2026-08-03T12:00:00.000Z",
    labels: [WORKSPACE_LABELS[0]],
    createdAt: "2026-07-22T12:15:00.000Z",
  },
  {
    id: "AMR-123",
    title: "Export filtered issues to CSV",
    description:
      "Allow team leads to export the current issue view for weekly reporting.",
    status: "BACKLOG",
    priority: "LOW",
    kind: "FEATURE",
    assignee: "Maya Chen",
    dueDate: null,
    labels: [WORKSPACE_LABELS[2]],
    createdAt: "2026-07-21T16:50:00.000Z",
  },
  {
    id: "AMR-122",
    title: "Incorrect avatar shown after reassignment",
    description:
      "The activity feed updates but the issue header retains the previous owner.",
    status: "DONE",
    priority: "MEDIUM",
    kind: "BUG",
    assignee: "Jon Bell",
    dueDate: null,
    labels: [WORKSPACE_LABELS[1]],
    createdAt: "2026-07-20T10:30:00.000Z",
  },
  {
    id: "AMR-121",
    title: "Create keyboard shortcut reference",
    description:
      "Add a searchable reference for navigation and issue actions.",
    status: "OPEN",
    priority: "NO_PRIORITY",
    kind: "TASK",
    assignee: "Unassigned",
    dueDate: null,
    labels: [WORKSPACE_LABELS[4]],
    createdAt: "2026-07-19T09:05:00.000Z",
  },
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  BACKLOG: "Backlog",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  NO_PRIORITY: "No priority",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const KIND_LABELS: Record<IssueKind, string> = {
  BUG: "Bug",
  FEATURE: "Feature",
  TASK: "Task",
};
