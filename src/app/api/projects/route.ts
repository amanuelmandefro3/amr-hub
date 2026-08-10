import { NextResponse } from "next/server";
import { createProjectSchema } from "../../../server/projectSchemas";
import {
  createProject,
  DuplicateProjectKeyError,
  DuplicateProjectNameError,
  listProjects,
} from "../../../server/projects";
import {
  actorFromSession,
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
  viewerForbiddenResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  try {
    return NextResponse.json(await listProjects(session.workspace.id));
  } catch (error) {
    console.error("Failed to load projects", error);
    return NextResponse.json(
      { error: "Projects could not be loaded" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();
  if (session.workspace.role === "viewer") return viewerForbiddenResponse();

  try {
    const validation = createProjectSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await createProject(validation.data, actorFromSession(session)),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    if (
      error instanceof DuplicateProjectKeyError ||
      error instanceof DuplicateProjectNameError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to create project", error);
    return NextResponse.json(
      { error: "Project could not be created" },
      { status: 500 },
    );
  }
}
