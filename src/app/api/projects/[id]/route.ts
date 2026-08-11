import { NextRequest, NextResponse } from "next/server";
import { updateProjectSchema } from "../../../../server/projectSchemas";
import {
  DuplicateProjectKeyError,
  DuplicateProjectNameError,
  getProject,
  updateProject,
} from "../../../../server/projects";
import {
  requireWorkspaceRole,
  requireWorkspaceSession,
} from "../../../../server/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const result = await requireWorkspaceSession(request);
  if ("response" in result) return result.response;
  const { session } = result;

  const { id } = await context.params;
  const project = await getProject(id, session.workspace.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const result = await requireWorkspaceRole(request, ["owner", "member"]);
  if ("response" in result) return result.response;
  const { session } = result;

  try {
    const validation = updateProjectSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const project = await updateProject(
      id,
      validation.data,
      session.workspace.id,
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
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

    console.error("Failed to update project", error);
    return NextResponse.json(
      { error: "Project could not be updated" },
      { status: 500 },
    );
  }
}
