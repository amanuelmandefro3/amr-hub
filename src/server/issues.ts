import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import {
  KIND_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  WORKSPACE_LABELS,
  type Issue,
  type IssueActivityType,
  type IssueKind,
  type IssuePriority,
  type IssueStatus,
  type IssueUpdates,
  type NewIssueInput,
  type WorkspaceLabel,
} from "../app/data/issues";

export type WorkspaceActor = {
  id: string;
  name: string;
  organizationId: string;
  organizationKey: string;
};

const issueInclude = {
  comments: {
    orderBy: { createdAt: "asc" },
  },
  activity: {
    orderBy: { createdAt: "desc" },
  },
  labels: {
    include: { label: true },
    orderBy: { label: { name: "asc" } },
  },
  cycle: true,
} satisfies Prisma.IssueInclude;

type StoredIssue = Prisma.IssueGetPayload<{
  include: typeof issueInclude;
}>;

function serializeIssue(issue: StoredIssue): Issue {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueStatus,
    priority: issue.priority as IssuePriority,
    kind: issue.kind as IssueKind,
    assignee: issue.assignee,
    dueDate: issue.dueDate?.toISOString() ?? null,
    estimate: issue.estimate as Issue["estimate"],
    cycleId: issue.cycleId,
    labels: issue.labels.map(({ label }) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    createdAt: issue.createdAt.toISOString(),
    comments: issue.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    })),
    activity: issue.activity.map((event) => ({
      id: event.id,
      type: event.type as IssueActivityType,
      description: event.description,
      actor: event.actor,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function ensureWorkspaceLabels(organizationId: string) {
  await prisma.$transaction(
    WORKSPACE_LABELS.map((label) =>
      prisma.label.upsert({
        where: {
          organizationId_name: {
            organizationId,
            name: label.name,
          },
        },
        create: {
          ...label,
          id: `${organizationId}:${label.id}`,
          organizationId,
        },
        update: {
          color: label.color,
        },
      }),
    ),
  );
}

export async function listLabels(
  organizationId: string,
): Promise<WorkspaceLabel[]> {
  await ensureWorkspaceLabels(organizationId);
  return prisma.label.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      color: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function listIssues(organizationId: string) {
  const issues = await prisma.issue.findMany({
    where: { organizationId },
    include: issueInclude,
    orderBy: { sequence: "desc" },
  });

  return issues.map(serializeIssue);
}

export async function createIssue(
  input: NewIssueInput,
  actor: WorkspaceActor,
) {
  await ensureWorkspaceLabels(actor.organizationId);
  await validateLabelIds(input.labelIds, actor.organizationId);
  await validateCycleId(input.cycleId, actor.organizationId);

  const issue = await prisma.$transaction(async (transaction) => {
    const latestIssue = await transaction.issue.findFirst({
      where: { organizationId: actor.organizationId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const sequence = (latestIssue?.sequence ?? 0) + 1;
    const { dueDate, labelIds, ...fields } = input;

    return transaction.issue.create({
      data: {
        ...fields,
        id: `${actor.organizationKey}-${sequence}`,
        sequence,
        organizationId: actor.organizationId,
        status: "OPEN",
        dueDate: dueDate ? parseDueDate(dueDate) : null,
        activity: {
          create: {
            type: "CREATED",
            description: "created the issue",
            actor: actor.name,
            user: { connect: { id: actor.id } },
          },
        },
        labels: {
          create: labelIds.map((labelId) => ({
            label: { connect: { id: labelId } },
          })),
        },
      },
      include: issueInclude,
    });
  });

  return serializeIssue(issue);
}

function parseDueDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function dueDateKey(value: Date | string | null) {
  if (!value) return null;
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10);
}

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDueDate(value));
}

async function validateLabelIds(labelIds: string[], organizationId: string) {
  if (labelIds.length === 0) return;

  const count = await prisma.label.count({
    where: {
      id: { in: labelIds },
      organizationId,
    },
  });

  if (count !== labelIds.length) {
    throw new UnknownLabelError();
  }
}

export class UnknownLabelError extends Error {
  constructor() {
    super("One or more labels do not exist");
    this.name = "UnknownLabelError";
  }
}

async function validateCycleId(
  cycleId: string | null | undefined,
  organizationId: string,
) {
  if (!cycleId) return null;

  const cycle = await prisma.cycle.findFirst({
    where: {
      id: cycleId,
      organizationId,
    },
    select: { name: true },
  });

  if (!cycle) {
    throw new UnknownCycleError();
  }

  return cycle.name;
}

export class UnknownCycleError extends Error {
  constructor() {
    super("The selected cycle does not exist");
    this.name = "UnknownCycleError";
  }
}

function buildActivity(
  current: StoredIssue,
  updates: IssueUpdates,
  nextCycleName: string | null,
  actor: WorkspaceActor,
): Prisma.ActivityCreateWithoutIssueInput[] {
  const events: Prisma.ActivityCreateWithoutIssueInput[] = [];

  if (updates.status && updates.status !== current.status) {
    events.push({
      type: "STATUS_CHANGED",
      description: `changed status from ${
        STATUS_LABELS[current.status as IssueStatus]
      } to ${STATUS_LABELS[updates.status]}`,
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (updates.priority && updates.priority !== current.priority) {
    events.push({
      type: "PRIORITY_CHANGED",
      description: `changed priority from ${
        PRIORITY_LABELS[current.priority as IssuePriority]
      } to ${PRIORITY_LABELS[updates.priority]}`,
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (updates.assignee && updates.assignee !== current.assignee) {
    events.push({
      type: "ASSIGNEE_CHANGED",
      description:
        updates.assignee === "Unassigned"
          ? "removed the assignee"
          : `assigned the issue to ${updates.assignee}`,
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (updates.kind && updates.kind !== current.kind) {
    events.push({
      type: "TYPE_CHANGED",
      description: `changed type from ${
        KIND_LABELS[current.kind as IssueKind]
      } to ${KIND_LABELS[updates.kind]}`,
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  const changedTitle =
    updates.title !== undefined && updates.title !== current.title;
  const changedDescription =
    updates.description !== undefined &&
    updates.description !== current.description;

  if (changedTitle || changedDescription) {
    events.push({
      type: "CONTENT_UPDATED",
      description: "updated issue details",
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (
    updates.dueDate !== undefined &&
    dueDateKey(updates.dueDate) !== dueDateKey(current.dueDate)
  ) {
    events.push({
      type: "DUE_DATE_CHANGED",
      description: updates.dueDate
        ? `set the due date to ${formatDueDate(updates.dueDate)}`
        : "removed the due date",
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (updates.labelIds) {
    const currentLabelIds = current.labels.map(({ labelId }) => labelId).sort();
    const nextLabelIds = [...updates.labelIds].sort();

    if (currentLabelIds.join(",") !== nextLabelIds.join(",")) {
      events.push({
        type: "LABELS_CHANGED",
        description: "updated issue labels",
        actor: actor.name,
        user: { connect: { id: actor.id } },
      });
    }
  }

  if (
    updates.estimate !== undefined &&
    updates.estimate !== current.estimate
  ) {
    events.push({
      type: "ESTIMATE_CHANGED",
      description: updates.estimate
        ? `set the estimate to ${updates.estimate} ${
            updates.estimate === 1 ? "point" : "points"
          }`
        : "removed the estimate",
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  if (
    updates.cycleId !== undefined &&
    updates.cycleId !== current.cycleId
  ) {
    events.push({
      type: "CYCLE_CHANGED",
      description: nextCycleName
        ? `moved the issue to ${nextCycleName}`
        : current.cycle
          ? `removed the issue from ${current.cycle.name}`
          : "removed the issue from its cycle",
      actor: actor.name,
      user: { connect: { id: actor.id } },
    });
  }

  return events;
}

export async function updateIssue(
  id: string,
  updates: IssueUpdates,
  actor: WorkspaceActor,
) {
  if (updates.labelIds) {
    await ensureWorkspaceLabels(actor.organizationId);
    await validateLabelIds(updates.labelIds, actor.organizationId);
  }
  const nextCycleName = await validateCycleId(
    updates.cycleId,
    actor.organizationId,
  );

  const issue = await prisma.$transaction(async (transaction) => {
    const current = await transaction.issue.findFirst({
      where: {
        id,
        organizationId: actor.organizationId,
      },
      include: issueInclude,
    });

    if (!current) return null;

    const activity = buildActivity(current, updates, nextCycleName, actor);
    const changed = activity.length > 0;
    if (!changed) return current;
    const { dueDate, labelIds, ...fields } = updates;

    return transaction.issue.update({
      where: { id },
      data: {
        ...fields,
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? parseDueDate(dueDate) : null }
          : {}),
        ...(labelIds
          ? {
              labels: {
                deleteMany: {},
                create: labelIds.map((labelId) => ({
                  label: { connect: { id: labelId } },
                })),
              },
            }
          : {}),
        activity: {
          create: activity,
        },
      },
      include: issueInclude,
    });
  });

  return issue ? serializeIssue(issue) : null;
}

export async function addComment(
  id: string,
  body: string,
  actor: WorkspaceActor,
) {
  const exists = await prisma.issue.count({
    where: {
      id,
      organizationId: actor.organizationId,
    },
  });
  if (!exists) return null;

  const issue = await prisma.issue.update({
    where: { id },
    data: {
      comments: {
        create: {
          body,
          author: actor.name,
          user: { connect: { id: actor.id } },
        },
      },
      activity: {
        create: {
          type: "COMMENT_ADDED",
          description: "commented on the issue",
          actor: actor.name,
          user: { connect: { id: actor.id } },
        },
      },
    },
    include: issueInclude,
  });

  return serializeIssue(issue);
}
