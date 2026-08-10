"use client";

import Link from "next/link";
import { CalendarClock, FolderKanban, Plus } from "lucide-react";
import { useProjects } from "../ProjectProvider";
import { authClient } from "../../lib/auth-client";
import { WorkspaceLoading } from "../components/WorkspaceLoading";
import { PROJECT_STATUS_LABELS } from "../data/projects";

function formatTargetDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const { data: activeMember } = authClient.useActiveMember();
  const isViewer = activeMember?.role === "viewer";

  if (isLoading) {
    return <WorkspaceLoading label="projects" />;
  }

  return (
    <div className="page projects-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Projects</h1>
          <p className="page-description">
            Group related work, track delivery, and plan cycles per project.
          </p>
        </div>
        {!isViewer && (
          <Link className="primary-button" href="/projects/new">
            <Plus size={16} aria-hidden="true" />
            New project
          </Link>
        )}
      </header>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={24} aria-hidden="true" />
          <h2>No projects yet</h2>
          <p>Create a project to start organizing issues and cycles.</p>
          {!isViewer && (
            <Link className="secondary-button" href="/projects/new">
              <Plus size={15} aria-hidden="true" />
              New project
            </Link>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const progress =
              project.issueCount === 0
                ? 0
                : Math.round(
                    (project.doneIssueCount / project.issueCount) * 100,
                  );

            return (
              <Link
                href={`/projects/${project.id}`}
                className="project-card"
                key={project.id}
              >
                <div className="project-card-header">
                  <div className="project-card-title">
                    <span
                      className="project-color-dot"
                      style={{ background: project.color ?? "var(--gray-300)" }}
                    />
                    <h3>{project.name}</h3>
                  </div>
                  <span
                    className={`project-status-badge project-status-${project.status.toLowerCase()}`}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>

                {project.description && (
                  <p className="project-card-description">
                    {project.description}
                  </p>
                )}

                <div className="project-progress-track">
                  <div
                    className="project-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="project-card-meta">
                  <span className="project-card-key">{project.key}</span>
                  <span>
                    {project.doneIssueCount}/{project.issueCount} issues done
                  </span>
                </div>

                {(project.activeCycleName || project.targetDate) && (
                  <div className="project-card-meta">
                    <span>
                      {project.activeCycleName
                        ? `In ${project.activeCycleName}`
                        : ""}
                    </span>
                    {project.targetDate && (
                      <span>
                        <CalendarClock size={12} aria-hidden="true" />{" "}
                        {formatTargetDate(project.targetDate)}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
