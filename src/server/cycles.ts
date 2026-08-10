import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Cycle, NewCycleInput } from "../app/data/issues";
import prisma from "../../prisma/client";
import type { WorkspaceActor } from "./issues";

function serializeCycle(cycle: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  projectId: string;
}): Cycle {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    capacity: cycle.capacity,
    projectId: cycle.projectId,
  };
}

export async function listCycles(
  organizationId: string,
  projectId?: string,
): Promise<Cycle[]> {
  const cycles = await prisma.cycle.findMany({
    where: { organizationId, ...(projectId ? { projectId } : {}) },
    orderBy: { startDate: "asc" },
  });

  return cycles.map(serializeCycle);
}

export class UnknownProjectError extends Error {
  constructor() {
    super("The selected project does not exist");
    this.name = "UnknownProjectError";
  }
}

export class DuplicateCycleNameError extends Error {
  constructor() {
    super("A cycle with this name already exists in this project");
    this.name = "DuplicateCycleNameError";
  }
}

function parseCycleDate(value: string, endOfDay: boolean) {
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
}

export async function createCycle(
  input: NewCycleInput,
  actor: WorkspaceActor,
) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: actor.organizationId },
    select: { id: true },
  });
  if (!project) throw new UnknownProjectError();

  try {
    const cycle = await prisma.cycle.create({
      data: {
        id: randomUUID(),
        name: input.name,
        startDate: parseCycleDate(input.startDate, false),
        endDate: parseCycleDate(input.endDate, true),
        capacity: input.capacity,
        projectId: input.projectId,
        organizationId: actor.organizationId,
      },
    });

    return serializeCycle(cycle);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateCycleNameError();
    }
    throw error;
  }
}
