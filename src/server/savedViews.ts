import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import {
  type SavedView,
  type SavedViewInput,
  type SavedViewPriority,
  type SavedViewSort,
  type SavedViewStatus,
} from "../app/data/issues";
import { CURRENT_USER, UnknownLabelError } from "./issues";

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
}): SavedView {
  return {
    ...view,
    status: view.status as SavedViewStatus,
    priority: view.priority as SavedViewPriority,
    sort: view.sort as SavedViewSort,
  };
}

export async function listSavedViews() {
  const views = await prisma.savedView.findMany({
    orderBy: [{ owner: "asc" }, { name: "asc" }],
  });

  return views.map(serializeSavedView);
}

export async function createSavedView(input: SavedViewInput) {
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
        owner: CURRENT_USER,
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

export async function deleteSavedView(id: string) {
  try {
    await prisma.savedView.delete({ where: { id } });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
}

export class DuplicateSavedViewError extends Error {
  constructor() {
    super("A saved view with this name already exists");
    this.name = "DuplicateSavedViewError";
  }
}
