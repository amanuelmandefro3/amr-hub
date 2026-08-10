"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { CreateIssueForm } from "./CreateIssueForm";

export function CreateIssueModal({
  projectId,
  onClose,
}: {
  projectId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="create-issue-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-title"
      >
        <header>
          <div>
            <h2 id="create-issue-title">Create an issue</h2>
            <p>Give your team the context they need to act.</p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close create issue dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <CreateIssueForm
          defaultProjectId={projectId}
          onCreated={(issue) => {
            onClose();
            router.push(`/issues/${issue.id}`);
          }}
          onCancel={onClose}
        />
      </section>
    </div>
  );
}
