"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Issue,
  type IssueStatus,
  type IssueUpdates,
  type NewIssueInput,
} from "./data/issues";

type IssueContextValue = {
  issues: Issue[];
  isLoading: boolean;
  createIssue: (issue: NewIssueInput) => Promise<Issue>;
  updateStatus: (id: string, status: IssueStatus) => Promise<boolean>;
  updateIssue: (id: string, updates: IssueUpdates) => Promise<boolean>;
  addComment: (issueId: string, body: string) => Promise<boolean>;
  refreshIssues: () => Promise<void>;
};

const IssueContext = createContext<IssueContextValue | null>(null);

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const responseError =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null;

    throw new Error(
      responseError ?? "The workspace request failed",
    );
  }

  return payload as T;
}

export function IssueProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setIssues(await apiRequest<Issue[]>("/api/issues"));
    } catch (requestError) {
      setError(messageFrom(requestError, "Issues could not be loaded"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Issue[]>("/api/issues", { signal: controller.signal })
      .then((loadedIssues) => {
        setIssues(loadedIssues);
        setError(null);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(messageFrom(requestError, "Issues could not be loaded"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const replaceIssue = useCallback((nextIssue: Issue) => {
    setIssues((current) =>
      current.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue)),
    );
  }, []);

  const createIssue = useCallback(async (input: NewIssueInput) => {
    setError(null);

    try {
      const issue = await apiRequest<Issue>("/api/issues", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setIssues((current) => [issue, ...current]);
      return issue;
    } catch (requestError) {
      const message = messageFrom(requestError, "Issue could not be created");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateIssue = useCallback(
    async (id: string, updates: IssueUpdates) => {
      setError(null);

      try {
        const issue = await apiRequest<Issue>(
          `/api/issues/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(updates),
          },
        );
        replaceIssue(issue);
        return true;
      } catch (requestError) {
        setError(messageFrom(requestError, "Issue could not be updated"));
        return false;
      }
    },
    [replaceIssue],
  );

  const updateStatus = useCallback(
    (id: string, status: IssueStatus) => updateIssue(id, { status }),
    [updateIssue],
  );

  const addComment = useCallback(
    async (issueId: string, body: string) => {
      setError(null);

      try {
        const issue = await apiRequest<Issue>(
          `/api/issues/${encodeURIComponent(issueId)}/comments`,
          {
            method: "POST",
            body: JSON.stringify({ body }),
          },
        );
        replaceIssue(issue);
        return true;
      } catch (requestError) {
        setError(messageFrom(requestError, "Comment could not be added"));
        return false;
      }
    },
    [replaceIssue],
  );

  const value = useMemo(
    () => ({
      issues,
      isLoading,
      createIssue,
      updateStatus,
      updateIssue,
      addComment,
      refreshIssues,
    }),
    [
      issues,
      isLoading,
      createIssue,
      updateStatus,
      updateIssue,
      addComment,
      refreshIssues,
    ],
  );

  return (
    <IssueContext.Provider value={value}>
      {children}
      {error && (
        <div className="sync-error" role="alert">
          <span>
            <strong>Workspace not synced</strong>
            {error}
          </span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssueContext);

  if (!context) {
    throw new Error("useIssues must be used within an IssueProvider");
  }

  return context;
}
