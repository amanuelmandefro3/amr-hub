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
  type Cycle,
  type Issue,
  type IssueStatus,
  type IssueUpdates,
  type NewIssueInput,
  type SavedView,
  type SavedViewInput,
  type WorkspaceLabel,
} from "./data/issues";

type IssueContextValue = {
  issues: Issue[];
  labels: WorkspaceLabel[];
  savedViews: SavedView[];
  cycles: Cycle[];
  isLoading: boolean;
  createIssue: (issue: NewIssueInput) => Promise<Issue>;
  updateStatus: (id: string, status: IssueStatus) => Promise<boolean>;
  updateIssue: (id: string, updates: IssueUpdates) => Promise<boolean>;
  addComment: (issueId: string, body: string) => Promise<boolean>;
  createSavedView: (view: SavedViewInput) => Promise<SavedView>;
  deleteSavedView: (id: string) => Promise<boolean>;
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

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/login");
    throw new Error("Your session has expired");
  }

  if (
    response.status === 409 &&
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    payload.code === "ORGANIZATION_REQUIRED" &&
    typeof window !== "undefined"
  ) {
    window.location.assign("/onboarding");
    throw new Error("Organization setup is required");
  }

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
  const [labels, setLabels] = useState<WorkspaceLabel[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [loadedIssues, loadedLabels, loadedViews, loadedCycles] =
        await Promise.all([
          apiRequest<Issue[]>("/api/issues"),
          apiRequest<WorkspaceLabel[]>("/api/labels"),
          apiRequest<SavedView[]>("/api/views"),
          apiRequest<Cycle[]>("/api/cycles"),
        ]);
      setIssues(loadedIssues);
      setLabels(loadedLabels);
      setSavedViews(loadedViews);
      setCycles(loadedCycles);
    } catch (requestError) {
      setError(messageFrom(requestError, "Issues could not be loaded"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      apiRequest<Issue[]>("/api/issues", { signal: controller.signal }),
      apiRequest<WorkspaceLabel[]>("/api/labels", {
        signal: controller.signal,
      }),
      apiRequest<SavedView[]>("/api/views", {
        signal: controller.signal,
      }),
      apiRequest<Cycle[]>("/api/cycles", {
        signal: controller.signal,
      }),
    ])
      .then(([loadedIssues, loadedLabels, loadedViews, loadedCycles]) => {
        setIssues(loadedIssues);
        setLabels(loadedLabels);
        setSavedViews(loadedViews);
        setCycles(loadedCycles);
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

  const createSavedView = useCallback(async (input: SavedViewInput) => {
    setError(null);

    try {
      const view = await apiRequest<SavedView>("/api/views", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setSavedViews((current) =>
        [...current, view].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      return view;
    } catch (requestError) {
      const message = messageFrom(
        requestError,
        "Saved view could not be created",
      );
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteSavedView = useCallback(async (id: string) => {
    setError(null);

    try {
      await apiRequest<void>(`/api/views/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setSavedViews((current) => current.filter((view) => view.id !== id));
      return true;
    } catch (requestError) {
      setError(messageFrom(requestError, "Saved view could not be deleted"));
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      issues,
      labels,
      savedViews,
      cycles,
      isLoading,
      createIssue,
      updateStatus,
      updateIssue,
      addComment,
      createSavedView,
      deleteSavedView,
      refreshIssues,
    }),
    [
      issues,
      labels,
      savedViews,
      cycles,
      isLoading,
      createIssue,
      updateStatus,
      updateIssue,
      addComment,
      createSavedView,
      deleteSavedView,
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
