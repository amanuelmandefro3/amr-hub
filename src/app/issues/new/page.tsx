"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import { CreateIssueForm } from "../../components/CreateIssueForm";
import { WorkspaceLoading } from "../../components/WorkspaceLoading";

export default function NewIssuePage() {
  return (
    <Suspense fallback={<WorkspaceLoading label="new issue" />}>
      <NewIssueForm />
    </Suspense>
  );
}

function NewIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: activeMember } = authClient.useActiveMember();

  useEffect(() => {
    if (activeMember?.role === "viewer") {
      router.replace("/issues");
    }
  }, [activeMember?.role, router]);

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
        <CreateIssueForm
          defaultProjectId={searchParams.get("project")}
          onCreated={(issue) => router.push(`/issues/${issue.id}`)}
          onCancel={() => router.push("/issues")}
        />

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
