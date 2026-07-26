import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import {
  DEMO_ISSUES,
  KIND_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  WORKSPACE_LABELS,
  type Issue,
  type IssueActivity,
  type IssueActivityType,
  type IssueKind,
  type IssuePriority,
  type IssueStatus,
  type IssueUpdates,
  type NewIssueInput,
  type WorkspaceLabel,
} from "../app/data/issues";

export const CURRENT_USER = "Amanuel R.";

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

function issueSequence(id: string) {
  const sequence = Number(id.split("-")[1]);
  return Number.isFinite(sequence) ? sequence : 0;
}

async function ensureDemoWorkspace() {
  await ensureWorkspaceLabels();
  if ((await prisma.issue.count()) > 0) return;

  try {
    await prisma.$transaction(
      DEMO_ISSUES.map((issue) =>
        prisma.issue.create({
          data: {
            id: issue.id,
            sequence: issueSequence(issue.id),
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            kind: issue.kind,
            assignee: issue.assignee,
            dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
            createdAt: new Date(issue.createdAt),
            labels: {
              create: issue.labels.map((label) => ({
                label: { connect: { id: label.id } },
              })),
            },
            comments: {
              create: (issue.comments ?? []).map((comment) => ({
                id: comment.id,
                body: comment.body,
                author: comment.author,
                createdAt: new Date(comment.createdAt),
              })),
            },
            activity: {
              create: (issue.activity ?? []).map((event) => ({
                id: event.id,
                type: event.type,
                description: event.description,
                actor: event.actor,
                createdAt: new Date(event.createdAt),
              })),
            },
          },
        }),
      ),
    );
  } catch (error) {
    if (
      !(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
    ) {
      throw error;
    }
  }
}

export async function ensureWorkspaceLabels() {
  if ((await prisma.label.count()) >= WORKSPACE_LABELS.length) return;

  await prisma.$transaction(
    WORKSPACE_LABELS.map((label) =>
      prisma.label.upsert({
        where: { id: label.id },
        create: label,
        update: {
          name: label.name,
          color: label.color,
        },
      }),
    ),
  );
}

export async function listLabels(): Promise<WorkspaceLabel[]> {
  await ensureWorkspaceLabels();
  return prisma.label.findMany({
    select: {
      id: true,
      name: true,
      color: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function listIssues() {
  await ensureDemoWorkspace();

  const issues = await prisma.issue.findMany({
    include: issueInclude,
    orderBy: { sequence: "desc" },
  });

  return issues.map(serializeIssue);
}

export async function createIssue(input: NewIssueInput) {
  await ensureWorkspaceLabels();
  await validateLabelIds(input.labelIds);

  const issue = await prisma.$transaction(async (transaction) => {
    const latestIssue = await transaction.issue.findFirst({
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const sequence = (latestIssue?.sequence ?? 128) + 1;
    const { dueDate, labelIds, ...fields } = input;

    return transaction.issue.create({
      data: {
        ...fields,
        id: `AMR-${sequence}`,
        sequence,
        status: "OPEN",
        dueDate: dueDate ? parseDueDate(dueDate) : null,
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

async function validateLabelIds(labelIds: string[]) {
  if (labelIds.length === 0) return;

  const count = await prisma.label.count({
    where: { id: { in: labelIds } },
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

function buildActivity(
  current: StoredIssue,
  updates: IssueUpdates,
): Prisma.ActivityCreateWithoutIssueInput[] {
  const events: Omit<IssueActivity, "id" | "createdAt">[] = [];

  if (updates.status && updates.status !== current.status) {
    events.push({
      type: "STATUS_CHANGED",
      description: `changed status from ${
        STATUS_LABELS[current.status as IssueStatus]
      } to ${STATUS_LABELS[updates.status]}`,
      actor: CURRENT_USER,
    });
  }

  if (updates.priority && updates.priority !== current.priority) {
    events.push({
      type: "PRIORITY_CHANGED",
      description: `changed priority from ${
        PRIORITY_LABELS[current.priority as IssuePriority]
      } to ${PRIORITY_LABELS[updates.priority]}`,
      actor: CURRENT_USER,
    });
  }

  if (updates.assignee && updates.assignee !== current.assignee) {
    events.push({
      type: "ASSIGNEE_CHANGED",
      description:
        updates.assignee === "Unassigned"
          ? "removed the assignee"
          : `assigned the issue to ${updates.assignee}`,
      actor: CURRENT_USER,
    });
  }

  if (updates.kind && updates.kind !== current.kind) {
    events.push({
      type: "TYPE_CHANGED",
      description: `changed type from ${
        KIND_LABELS[current.kind as IssueKind]
      } to ${KIND_LABELS[updates.kind]}`,
      actor: CURRENT_USER,
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
      actor: CURRENT_USER,
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
      actor: CURRENT_USER,
    });
  }

  if (updates.labelIds) {
    const currentLabelIds = current.labels.map(({ labelId }) => labelId).sort();
    const nextLabelIds = [...updates.labelIds].sort();

    if (currentLabelIds.join(",") !== nextLabelIds.join(",")) {
      events.push({
        type: "LABELS_CHANGED",
        description: "updated issue labels",
        actor: CURRENT_USER,
      });
    }
  }

  return events;
}

export async function updateIssue(id: string, updates: IssueUpdates) {
  if (updates.labelIds) {
    await ensureWorkspaceLabels();
    await validateLabelIds(updates.labelIds);
  }

  const issue = await prisma.$transaction(async (transaction) => {
    const current = await transaction.issue.findUnique({
      where: { id },
      include: issueInclude,
    });

    if (!current) return null;

    const activity = buildActivity(current, updates);
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

export async function addComment(id: string, body: string) {
  const exists = await prisma.issue.count({ where: { id } });
  if (!exists) return null;

  const issue = await prisma.issue.update({
    where: { id },
    data: {
      comments: {
        create: {
          body,
          author: CURRENT_USER,
        },
      },
      activity: {
        create: {
          type: "COMMENT_ADDED",
          description: "commented on the issue",
          actor: CURRENT_USER,
        },
      },
    },
    include: issueInclude,
  });

  return serializeIssue(issue);
}
