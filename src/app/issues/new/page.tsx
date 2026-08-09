"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleAlert, Sparkles } from "lucide-react";
import { useIssues } from "../../IssueProvider";
import { IssueLabelChip } from "../../components/IssueLabelChip";
import {
  KIND_LABELS,
  PRIORITY_LABELS,
  type IssueEstimate,
  type IssueKind,
  type IssuePriority,
} from "../../data/issues";
import { findPlanningCycle, formatCycleDateRange } from "../../data/cycles";

const ESTIMATES: IssueEstimate[] = [1, 2, 3, 5, 8];

type FormErrors = {
  title?: string;
  description?: string;
};

export default function NewIssuePage() {
  const router = useRouter();
  const { createIssue, labels, cycles, members } = useIssues();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [kind, setKind] = useState<IssueKind>("BUG");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<IssueEstimate | null>(3);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedCycleId = cycleId ?? findPlanningCycle(cycles)?.id ?? "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: FormErrors = {};
    if (title.trim().length < 4) {
      nextErrors.title = "Use at least 4 characters for a clear issue title.";
    }
    if (description.trim().length < 12) {
      nextErrors.description =
        "Add enough detail for someone else to understand the issue.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const issue = await createIssue({
        title: title.trim(),
        description: description.trim(),
        priority,
        kind,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        cycleId: selectedCycleId || null,
        estimate,
        labelIds,
      });
      router.push(`/issues/${issue.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Issue could not be created",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page create-page">
      <Link className="back-link" href="/issues">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to issues
      </Link>

      <header className="page-header create-header">
        <div>
          <p className="eyebrow">Capture work</p>
          <h1>Create an issue</h1>
          <p className="page-description">
            Give your team the context they need to act.
          </p>
        </div>
      </header>

      <div className="create-layout">
        <form className="issue-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <div className="form-section-heading">
              <span>1</span>
              <div>
                <h2>Issue details</h2>
                <p>Describe the outcome or problem in plain language.</p>
              </div>
            </div>

            <label className="form-field">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder="e.g. Checkout fails after applying a discount"
                maxLength={255}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                autoFocus
              />
              {errors.title && (
                <small className="field-error" id="title-error">
                  <CircleAlert size={14} aria-hidden="true" />
                  {errors.title}
                </small>
              )}
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    description: undefined,
                  }));
                }}
                placeholder="What happened, what did you expect, and how can someone reproduce it?"
                rows={7}
                maxLength={2000}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "description-error" : "description-count"
                }
              />
              <span className="field-meta" id="description-count">
                {description.length} / 2,000
              </span>
              {errors.description && (
                <small className="field-error" id="description-error">
                  <CircleAlert size={14} aria-hidden="true" />
                  {errors.description}
                </small>
              )}
            </label>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <span>2</span>
              <div>
                <h2>Planning</h2>
                <p>Set enough structure for the team to triage the work.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Type</span>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as IssueKind)}
                >
                  {Object.entries(KIND_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Priority</span>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as IssuePriority)
                  }
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Assignee</span>
                <select
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Cycle</span>
                <select
                  value={selectedCycleId}
                  onChange={(event) => setCycleId(event.target.value)}
                >
                  <option value="">No cycle</option>
                  {cycles.map((cycle) => (
                    <option value={cycle.id} key={cycle.id}>
                      {cycle.name} - {formatCycleDateRange(cycle)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Estimate</span>
                <select
                  value={estimate ?? ""}
                  onChange={(event) =>
                    setEstimate(
                      event.target.value
                        ? (Number(event.target.value) as IssueEstimate)
                        : null,
                    )
                  }
                >
                  <option value="">No estimate</option>
                  {ESTIMATES.map((value) => (
                    <option value={value} key={value}>
                      {value} {value === 1 ? "point" : "points"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="form-field label-field">
              <legend>Labels</legend>
              <div className="label-options">
                {labels.map((label) => (
                  <label key={label.id}>
                    <input
                      type="checkbox"
                      checked={labelIds.includes(label.id)}
                      onChange={(event) =>
                        setLabelIds((current) =>
                          event.target.checked
                            ? [...current, label.id]
                            : current.filter((id) => id !== label.id),
                        )
                      }
                    />
                    <IssueLabelChip label={label} />
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
            <Link className="secondary-button" href="/issues">
              Cancel
            </Link>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              <Check size={16} aria-hidden="true" />
              {isSubmitting ? "Creating..." : "Create issue"}
            </button>
          </div>
        </form>

        <aside className="form-aside">
          <div className="tip-icon">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <h2>Write actionable issues</h2>
          <ul>
            <li>
              <Check size={15} aria-hidden="true" />
              Lead with the user or system impact.
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              Include the expected and actual behavior.
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              Add reproduction details when relevant.
            </li>
          </ul>
          <p>
            New issues start as <strong>Open</strong> so they are visible during
            triage.
          </p>
        </aside>
      </div>
    </div>
  );
}
