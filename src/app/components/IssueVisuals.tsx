import {
  Bug,
  Circle,
  CircleCheck,
  CircleDot,
  Clock3,
  Lightbulb,
  ListTodo,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import {
  KIND_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type IssueKind,
  type IssuePriority,
  type IssueStatus,
} from "../data/issues";

export function StatusBadge({ status }: { status: IssueStatus }) {
  const Icon =
    status === "DONE"
      ? CircleCheck
      : status === "IN_PROGRESS"
        ? Clock3
        : status === "OPEN"
          ? CircleDot
          : Circle;

  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon size={14} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const Icon =
    priority === "URGENT" || priority === "HIGH"
      ? SignalHigh
      : priority === "MEDIUM"
        ? SignalMedium
        : SignalLow;

  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      <Icon size={14} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function KindIcon({ kind }: { kind: IssueKind }) {
  const Icon = kind === "BUG" ? Bug : kind === "FEATURE" ? Lightbulb : ListTodo;

  return (
    <span className={`kind-icon kind-${kind.toLowerCase()}`}>
      <Icon size={15} aria-hidden="true" />
      <span className="sr-only">{KIND_LABELS[kind]}</span>
    </span>
  );
}
