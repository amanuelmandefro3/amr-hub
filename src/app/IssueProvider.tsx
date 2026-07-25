"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEMO_ISSUES,
  KIND_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Issue,
  type IssueActivity,
  type IssueActivityType,
  type IssueComment,
  type IssueKind,
  type IssuePriority,
  type IssueStatus,
} from "./data/issues";

type NewIssue = {
  title: string;
  description: string;
  priority: IssuePriority;
  kind: IssueKind;
  assignee: string;
};

type IssueUpdates = Partial<
  Pick<
    Issue,
    "title" | "description" | "status" | "priority" | "kind" | "assignee"
  >
>;

type IssueContextValue = {
  issues: Issue[];
  createIssue: (issue: NewIssue) => Issue;
  updateStatus: (id: string, status: IssueStatus) => void;
  updateIssue: (id: string, updates: IssueUpdates) => void;
  addComment: (issueId: string, body: string) => IssueComment;
  resetDemo: () => void;
};

const STORAGE_KEY = "amr-hub-issues-v1";
const CURRENT_USER = "Amanuel R.";
const IssueContext = createContext<IssueContextValue | null>(null);
const listeners = new Set<() => void>();
let clientIssues: Issue[] | undefined;

function getClientIssues() {
  if (clientIssues) return clientIssues;

  try {
    const savedIssues = window.localStorage.getItem(STORAGE_KEY);
    clientIssues = savedIssues
      ? (JSON.parse(savedIssues) as Issue[])
      : DEMO_ISSUES;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    clientIssues = DEMO_ISSUES;
  }

  return clientIssues;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function saveIssues(issues: Issue[]) {
  clientIssues = issues;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  listeners.forEach((listener) => listener());
}

function createActivity(
  type: IssueActivityType,
  description: string,
): IssueActivity {
  const createdAt = new Date().toISOString();

  return {
    id: `activity-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    description,
    actor: CURRENT_USER,
    createdAt,
  };
}

function updateStoredIssue(id: string, updates: IssueUpdates) {
  saveIssues(
    getClientIssues().map((issue) => {
      if (issue.id !== id) return issue;

      const events: IssueActivity[] = [];

      if (updates.status && updates.status !== issue.status) {
        events.push(
          createActivity(
            "STATUS_CHANGED",
            `changed status from ${STATUS_LABELS[issue.status]} to ${
              STATUS_LABELS[updates.status]
            }`,
          ),
        );
      }

      if (updates.priority && updates.priority !== issue.priority) {
        events.push(
          createActivity(
            "PRIORITY_CHANGED",
            `changed priority from ${PRIORITY_LABELS[issue.priority]} to ${
              PRIORITY_LABELS[updates.priority]
            }`,
          ),
        );
      }

      if (updates.assignee && updates.assignee !== issue.assignee) {
        events.push(
          createActivity(
            "ASSIGNEE_CHANGED",
            updates.assignee === "Unassigned"
              ? "removed the assignee"
              : `assigned the issue to ${updates.assignee}`,
          ),
        );
      }

      if (updates.kind && updates.kind !== issue.kind) {
        events.push(
          createActivity(
            "TYPE_CHANGED",
            `changed type from ${KIND_LABELS[issue.kind]} to ${
              KIND_LABELS[updates.kind]
            }`,
          ),
        );
      }

      const changedTitle =
        updates.title !== undefined && updates.title !== issue.title;
      const changedDescription =
        updates.description !== undefined &&
        updates.description !== issue.description;

      if (changedTitle || changedDescription) {
        events.push(createActivity("CONTENT_UPDATED", "updated issue details"));
      }

      if (events.length === 0) return issue;

      return {
        ...issue,
        ...updates,
        activity: [...(issue.activity ?? []), ...events],
      };
    }),
  );
}

export function IssueProvider({ children }: { children: React.ReactNode }) {
  const issues = useSyncExternalStore(
    subscribe,
    getClientIssues,
    () => DEMO_ISSUES,
  );

  const createIssue = useCallback(
    (input: NewIssue) => {
      const maxId = issues.reduce((highest, issue) => {
        const number = Number(issue.id.split("-")[1]);
        return Number.isNaN(number) ? highest : Math.max(highest, number);
      }, 128);

      const issue: Issue = {
        ...input,
        id: `AMR-${maxId + 1}`,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        comments: [],
      };

      saveIssues([issue, ...issues]);
      return issue;
    },
    [issues],
  );

  const updateStatus = useCallback((id: string, status: IssueStatus) => {
    updateStoredIssue(id, { status });
  }, []);

  const updateIssue = useCallback((id: string, updates: IssueUpdates) => {
    updateStoredIssue(id, updates);
  }, []);

  const addComment = useCallback((issueId: string, body: string) => {
    const comment: IssueComment = {
      id: `comment-${Date.now()}`,
      body: body.trim(),
      author: CURRENT_USER,
      createdAt: new Date().toISOString(),
    };
    const activity = createActivity(
      "COMMENT_ADDED",
      "commented on the issue",
    );

    saveIssues(
      getClientIssues().map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              comments: [...(issue.comments ?? []), comment],
              activity: [...(issue.activity ?? []), activity],
            }
          : issue,
      ),
    );

    return comment;
  }, []);

  const resetDemo = useCallback(() => saveIssues(DEMO_ISSUES), []);

  const value = useMemo(
    () => ({
      issues,
      createIssue,
      updateStatus,
      updateIssue,
      addComment,
      resetDemo,
    }),
    [issues, createIssue, updateStatus, updateIssue, addComment, resetDemo],
  );

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssueContext);

  if (!context) {
    throw new Error("useIssues must be used within an IssueProvider");
  }

  return context;
}
