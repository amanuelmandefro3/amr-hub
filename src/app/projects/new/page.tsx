"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleAlert, Sparkles } from "lucide-react";
import { useProjects } from "../../ProjectProvider";
import { authClient } from "../../../lib/auth-client";
import { PROJECT_COLORS } from "../../data/projects";

type FormErrors = {
  name?: string;
  key?: string;
};

function slugKey(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
}

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();
  const { data: activeMember } = authClient.useActiveMember();

  useEffect(() => {
    if (activeMember?.role === "viewer") {
      router.replace("/projects");
    }
  }, [activeMember?.role, router]);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [targetDate, setTargetDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayedKey = keyTouched ? key : slugKey(name);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: FormErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Use at least 2 characters for the project name.";
    }
    if (!/^[A-Z][A-Z0-9]{1,5}$/.test(displayedKey)) {
      nextErrors.key =
        "Use 2-6 letters/numbers, starting with a letter (e.g. ENG).";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createProject({
        name: name.trim(),
        key: displayedKey,
        description: description.trim() || null,
        color,
        targetDate: targetDate || null,
      });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Project could not be created",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page create-page">
      <Link className="back-link" href="/projects">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to projects
      </Link>

      <header className="page-header create-header">
        <div>
          <p className="eyebrow">Organize work</p>
          <h1>Create a project</h1>
          <p className="page-description">
            Projects group issues and cycles so teams can plan independently.
          </p>
        </div>
      </header>

      <div className="create-layout">
        <form className="issue-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <div className="form-section-heading">
              <span>1</span>
              <div>
                <h2>Project details</h2>
                <p>Give the project a clear name and short key.</p>
              </div>
            </div>

            <label className="form-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="e.g. Growth Engineering"
                maxLength={80}
                aria-invalid={Boolean(errors.name)}
                autoFocus
              />
              {errors.name && (
                <small className="field-error">
                  <CircleAlert size={14} aria-hidden="true" />
                  {errors.name}
                </small>
              )}
            </label>

            <label className="form-field">
              <span>Key</span>
              <input
                type="text"
                value={displayedKey}
                onChange={(event) => {
                  setKeyTouched(true);
                  setKey(event.target.value.toUpperCase());
                  setErrors((current) => ({ ...current, key: undefined }));
                }}
                placeholder="ENG"
                maxLength={6}
                aria-invalid={Boolean(errors.key)}
              />
              <span className="field-meta">
                Issues in this project will look like {displayedKey || "KEY"}-1
              </span>
              {errors.key && (
                <small className="field-error">
                  <CircleAlert size={14} aria-hidden="true" />
                  {errors.key}
                </small>
              )}
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this project trying to accomplish?"
                rows={4}
                maxLength={500}
              />
            </label>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <span>2</span>
              <div>
                <h2>Planning</h2>
                <p>Optional details that show up on the project card.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Target date</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
            </div>

            <fieldset className="form-field label-field">
              <legend>Color</legend>
              <div className="label-options">
                {PROJECT_COLORS.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name="color"
                      checked={color === option}
                      onChange={() => setColor(option)}
                    />
                    <span
                      className="project-color-dot"
                      style={{ background: option }}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="form-actions">
            {submitError && (
              <p className="form-submit-error" role="alert">
                <CircleAlert size={14} aria-hidden="true" />
                {submitError}
              </p>
            )}
            <Link className="secondary-button" href="/projects">
              Cancel
            </Link>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              <Check size={16} aria-hidden="true" />
              {isSubmitting ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>

        <aside className="form-aside">
          <div className="tip-icon">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <h2>Keep projects focused</h2>
          <ul>
            <li>
              <Check size={15} aria-hidden="true" />
              Scope a project to one team or initiative.
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              Short keys make issue ids easy to scan.
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              Cycles are planned separately per project.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
