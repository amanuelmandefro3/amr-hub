import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import type { WorkspaceActor } from "./issues";

export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELED";

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  targetDate: string | null;
  createdAt: string;
  issueCount: number;
  doneIssueCount: number;
  activeCycleName: string | null;
};

export type NewProjectInput = {
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  targetDate: string | null;
};

export type ProjectUpdates = Partial<{
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  targetDate: string | null;
}>;

function parseTargetDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function serializeProject(project: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  status: string;
  targetDate: Date | null;
  createdAt: Date;
}): Promise<Project> {
  const [issueCount, doneIssueCount, activeCycle] = await Promise.all([
    prisma.issue.count({ where: { projectId: project.id } }),
    prisma.issue.count({ where: { projectId: project.id, status: "DONE" } }),
    prisma.cycle.findFirst({
      where: {
        projectId: project.id,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      select: { name: true },
    }),
  ]);

  return {
    id: project.id,
    key: project.key,
    name: project.name,
    description: project.description,
    color: project.color,
    status: project.status as ProjectStatus,
    targetDate: project.targetDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    issueCount,
    doneIssueCount,
    activeCycleName: activeCycle?.name ?? null,
  };
}

export async function listProjects(
  organizationId: string,
): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(projects.map(serializeProject));
}

export async function getProject(id: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id, organizationId },
  });

  return project ? serializeProject(project) : null;
}

export class DuplicateProjectKeyError extends Error {
  constructor() {
    super("A project with this key already exists");
    this.name = "DuplicateProjectKeyError";
  }
}

export class DuplicateProjectNameError extends Error {
  constructor() {
    super("A project with this name already exists");
    this.name = "DuplicateProjectNameError";
  }
}

export async function createProject(
  input: NewProjectInput,
  actor: WorkspaceActor,
) {
  try {
    const project = await prisma.project.create({
      data: {
        id: randomUUID(),
        key: input.key,
        name: input.name,
        description: input.description,
        color: input.color,
        organizationId: actor.organizationId,
        targetDate: input.targetDate
          ? parseTargetDate(input.targetDate)
          : null,
      },
    });

    return serializeProject(project);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("key")) throw new DuplicateProjectKeyError();
      if (target.includes("name")) throw new DuplicateProjectNameError();
    }
    throw error;
  }
}

export async function updateProject(
  id: string,
  updates: ProjectUpdates,
  organizationId: string,
) {
  const current = await prisma.project.findFirst({
    where: { id, organizationId },
  });
  if (!current) return null;

  const { targetDate, ...fields } = updates;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...fields,
      ...(targetDate !== undefined
        ? { targetDate: targetDate ? parseTargetDate(targetDate) : null }
        : {}),
    },
  });

  return serializeProject(project);
}
