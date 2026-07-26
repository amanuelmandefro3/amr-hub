import type { CSSProperties } from "react";
import type { WorkspaceLabel } from "../data/issues";

export function IssueLabelChip({
  label,
  compact = false,
}: {
  label: WorkspaceLabel;
  compact?: boolean;
}) {
  return (
    <span
      className={compact ? "issue-label-chip compact" : "issue-label-chip"}
      style={{ "--label-color": label.color } as CSSProperties}
    >
      <i aria-hidden="true" />
      {label.name}
    </span>
  );
}
