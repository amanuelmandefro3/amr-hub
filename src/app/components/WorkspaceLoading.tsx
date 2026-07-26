import { LoaderCircle } from "lucide-react";

export function WorkspaceLoading({ label }: { label: string }) {
  return (
    <div className="page">
      <div className="workspace-loading" role="status" aria-live="polite">
        <LoaderCircle size={20} aria-hidden="true" />
        <span>Loading {label}</span>
      </div>
    </div>
  );
}
