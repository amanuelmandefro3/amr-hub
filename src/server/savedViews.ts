import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import {
  type SavedView,
  type SavedViewInput,
  type SavedViewPriority,
  type SavedViewSort,
  type SavedViewStatus,
} from "../app/data/issues";
import { UnknownLabelError, type WorkspaceActor } from "./issues";

function serializeSavedView(view: {
  id: string;
  name: string;
  owner: string;
  query: string;
  status: string;
  priority: string;
  assignee: string;
  sort: string;
  labelId: string | null;
  userId: string | null;
}): SavedView {
  return {
    id: view.id,
    name: view.name,
    owner: view.owner,
    query: view.query,
    status: view.status as SavedViewStatus,
    priority: view.priority as SavedViewPriority,
    assignee: view.assignee,
    sort: view.sort as SavedViewSort,
    labelId: view.labelId,
    isSystem: view.userId === null,
  };
}

export async function listSavedViews(userId: string) {
  const views = await prisma.savedView.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
    },
    orderBy: [{ owner: "asc" }, { name: "asc" }],
  });

  return views.map(serializeSavedView);
}

export async function createSavedView(
  input: SavedViewInput,
  actor: WorkspaceActor,
) {
  if (input.labelId) {
    const labelExists = await prisma.label.count({
      where: { id: input.labelId },
    });
    if (!labelExists) throw new UnknownLabelError();
  }

  try {
    const view = await prisma.savedView.create({
      data: {
        ...input,
        owner: actor.name,
        userId: actor.id,
      },
    });
    return serializeSavedView(view);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateSavedViewError();
    }
    throw error;
  }
}

export async function deleteSavedView(id: string, userId: string) {
  const result = await prisma.savedView.deleteMany({
    where: { id, userId },
  });

  return result.count === 1;
}

export class DuplicateSavedViewError extends Error {
  constructor() {
    super("A saved view with this name already exists");
    this.name = "DuplicateSavedViewError";
  }
}
