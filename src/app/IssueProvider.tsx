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
  type Issue,
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

type IssueContextValue = {
  issues: Issue[];
  createIssue: (issue: NewIssue) => Issue;
  updateStatus: (id: string, status: IssueStatus) => void;
  addComment: (issueId: string, body: string) => IssueComment;
  resetDemo: () => void;
};

const STORAGE_KEY = "amr-hub-issues-v1";
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
    saveIssues(
      getClientIssues().map((issue) =>
        issue.id === id ? { ...issue, status } : issue,
      ),
    );
  }, []);

  const addComment = useCallback((issueId: string, body: string) => {
    const comment: IssueComment = {
      id: `comment-${Date.now()}`,
      body: body.trim(),
      author: "Amanuel R.",
      createdAt: new Date().toISOString(),
    };

    saveIssues(
      getClientIssues().map((issue) =>
        issue.id === issueId
          ? { ...issue, comments: [...(issue.comments ?? []), comment] }
          : issue,
      ),
    );

    return comment;
  }, []);

  const resetDemo = useCallback(() => saveIssues(DEMO_ISSUES), []);

  const value = useMemo(
    () => ({ issues, createIssue, updateStatus, addComment, resetDemo }),
    [issues, createIssue, updateStatus, addComment, resetDemo],
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
