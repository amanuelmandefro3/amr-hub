"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarRange, Plus } from "lucide-react";
import { apiRequest, useIssues, type IssueListResponse } from "../../IssueProvider";
import { useProjects } from "../../ProjectProvider";
import { authClient } from "../../../lib/auth-client";
import { IssueBoard } from "../../components/IssueBoard";
import { WorkspaceLoading } from "../../components/WorkspaceLoading";
import { PROJECT_STATUS_LABELS } from "../../data/projects";
import type { Issue } from "../../data/issues";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { projects, isLoading: isLoadingProjects, setActiveProjectId } =
    useProjects();
  const { updateStatus } = useIssues();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const project = projects.find((candidate) => candidate.id === projectId);

  useEffect(() => {
    setActiveProjectId(projectId);
  }, [projectId, setActiveProjectId]);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<IssueListResponse>(`/api/issues?projectId=${projectId}`, {
      signal: controller.signal,
    })
      .then((response) => setIssues(response.issues))
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Issues could not be loaded",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingIssues(false);
      });

    return () => controller.abort();
  }, [projectId]);

  const handleStatusChange = async (issueId: string, status: Issue["status"]) => {
    const updated = await updateStatus(issueId, status);
    if (updated) {
      setIssues((current) =>
        current.map((issue) =>
          issue.id === issueId ? { ...issue, status } : issue,
        ),
      );
    }
    return updated;
  };

  if (isLoadingProjects) {
    return <WorkspaceLoading label="project" />;
  }

  if (!project) {
    return (
      <div className="page">
        <Link className="back-link" href="/projects">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to projects
        </Link>
        <div className="empty-state">
          <h2>Project not found</h2>
          <p>It may have been removed, or you may not have access.</p>
        </div>
      </div>
    );
  }

  const progress =
    project.issueCount === 0
      ? 0
      : Math.round((project.doneIssueCount / project.issueCount) * 100);

  return (
    <div className="page">
      <Link className="back-link" href="/projects">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to projects
      </Link>

      <header className="page-header">
        <div>
          <p className="eyebrow">
            <span
              className="project-color-dot"
              style={{
                display: "inline-block",
                marginRight: 6,
                background: project.color ?? "var(--gray-300)",
              }}
            />
            {project.key}
          </p>
          <h1>{project.name}</h1>
          {project.description && (
            <p className="page-description">{project.description}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            className="secondary-button"
            href={`/projects/${projectId}/cycles`}
          >
            <CalendarRange size={16} aria-hidden="true" />
            Cycles
          </Link>
          {!isViewer && (
            <Link
              className="primary-button"
              href={`/issues/new?project=${projectId}`}
            >
              <Plus size={16} aria-hidden="true" />
              New issue
            </Link>
          )}
        </div>
      </header>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div>
            <h2>Progress</h2>
            <p>
              {project.doneIssueCount} of {project.issueCount} issues done
              {project.activeCycleName ? ` · ${project.activeCycleName}` : ""}
            </p>
          </div>
          <span
            className={`project-status-badge project-status-${project.status.toLowerCase()}`}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="project-progress-track">
          <div className="project-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {isLoadingIssues ? (
        <WorkspaceLoading label="issues" />
      ) : (
        <IssueBoard
          issues={issues}
          isViewer={isViewer}
          onStatusChange={handleStatusChange}
        />
      )}

      {error && (
        <p className="form-submit-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
