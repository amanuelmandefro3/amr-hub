export type IssueStatus = "BACKLOG" | "OPEN" | "IN_PROGRESS" | "DONE";
export type IssuePriority =
  | "NO_PRIORITY"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";
export type IssueKind = "BUG" | "FEATURE" | "TASK";
export type IssueEstimate = 1 | 2 | 3 | 5 | 8;

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
  | "LABELS_CHANGED"
  | "CYCLE_CHANGED"
  | "ESTIMATE_CHANGED";

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

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
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
  isSystem: boolean;
};

export type SavedViewInput = Omit<SavedView, "id" | "owner" | "isSystem">;

export type Cycle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  projectId: string;
};

export type NewCycleInput = {
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  kind: IssueKind;
  assignee: WorkspaceMember | null;
  creator: WorkspaceMember | null;
  dueDate: string | null;
  estimate: IssueEstimate | null;
  projectId: string;
  cycleId: string | null;
  labels: WorkspaceLabel[];
  createdAt: string;
  comments?: IssueComment[];
  activity?: IssueActivity[];
};

export type NewIssueInput = Pick<
  Issue,
  | "title"
  | "description"
  | "priority"
  | "kind"
  | "estimate"
  | "cycleId"
  | "projectId"
> & {
  assigneeId: string | null;
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
    | "dueDate"
    | "estimate"
    | "cycleId"
  >
> & {
  assigneeId?: string | null;
  labelIds?: string[];
};

export const WORKSPACE_LABELS: WorkspaceLabel[] = [
  { id: "label-customer", name: "Customer impact", color: "#dc2626" },
  { id: "label-frontend", name: "Frontend", color: "#2563eb" },
  { id: "label-backend", name: "Backend", color: "#059669" },
  { id: "label-reliability", name: "Reliability", color: "#d97706" },
  { id: "label-design", name: "Design", color: "#7c3aed" },
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
