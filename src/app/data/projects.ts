export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELED";

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  targetDate: string | null;
  createdAt: string;
  issueCount: number;
  doneIssueCount: number;
  activeCycleName: string | null;
};

export type NewProjectInput = {
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  targetDate: string | null;
};

export type ProjectUpdates = Partial<
  Pick<Project, "name" | "description" | "color" | "status" | "targetDate">
>;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const PROJECT_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];
