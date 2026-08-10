"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { NewProjectInput, Project, ProjectUpdates } from "./data/projects";
import { apiRequest } from "./IssueProvider";

const ACTIVE_PROJECT_STORAGE_KEY = "amr-hub:active-project-id";

type ProjectContextValue = {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  setActiveProjectId: (id: string | null) => void;
  createProject: (input: NewProjectInput) => Promise<Project>;
  updateProject: (id: string, updates: ProjectUpdates) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    if (typeof window === "undefined") return;
    if (id) {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
  }, []);

  const applyLoadedProjects = useCallback((loaded: Project[]) => {
    setProjects(loaded);
    setActiveProjectIdState((current) => {
      if (current && loaded.some((project) => project.id === current)) {
        return current;
      }
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)
          : null;
      const restored = loaded.find((project) => project.id === stored);
      return (restored ?? loaded[0])?.id ?? null;
    });
  }, []);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      applyLoadedProjects(await apiRequest<Project[]>("/api/projects"));
    } catch (requestError) {
      setError(messageFrom(requestError, "Projects could not be loaded"));
    } finally {
      setIsLoading(false);
    }
  }, [applyLoadedProjects]);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Project[]>("/api/projects", { signal: controller.signal })
      .then(applyLoadedProjects)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(messageFrom(requestError, "Projects could not be loaded"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [applyLoadedProjects]);

  const createProject = useCallback(async (input: NewProjectInput) => {
    setError(null);

    try {
      const project = await apiRequest<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setProjects((current) => [...current, project]);
      setActiveProjectId(project.id);
      return project;
    } catch (requestError) {
      const message = messageFrom(
        requestError,
        "Project could not be created",
      );
      setError(message);
      throw new Error(message);
    }
  }, [setActiveProjectId]);

  const updateProject = useCallback(
    async (id: string, updates: ProjectUpdates) => {
      setError(null);

      try {
        const project = await apiRequest<Project>(
          `/api/projects/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(updates),
          },
        );
        setProjects((current) =>
          current.map((existing) =>
            existing.id === project.id ? project : existing,
          ),
        );
        return true;
      } catch (requestError) {
        setError(messageFrom(requestError, "Project could not be updated"));
        return false;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      projects,
      activeProjectId,
      isLoading,
      setActiveProjectId,
      createProject,
      updateProject,
      refreshProjects,
    }),
    [
      projects,
      activeProjectId,
      isLoading,
      setActiveProjectId,
      createProject,
      updateProject,
      refreshProjects,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
      {error && (
        <div className="sync-error" role="alert">
          <span>
            <strong>Projects not synced</strong>
            {error}
          </span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }

  return context;
}
