import type { Cycle } from "../app/data/issues";
import prisma from "../../prisma/client";

function serializeCycle(cycle: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
}): Cycle {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    capacity: cycle.capacity,
  };
}

export async function listCycles(organizationId: string): Promise<Cycle[]> {
  const cycles = await prisma.cycle.findMany({
    where: { organizationId },
    orderBy: { startDate: "asc" },
  });

  return cycles.map(serializeCycle);
}
