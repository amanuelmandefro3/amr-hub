import { NextResponse } from "next/server";
import { deleteSavedView } from "../../../../server/savedViews";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../../server/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  try {
    const { id } = await context.params;

    if (
      !(await deleteSavedView(
        id,
        session.user.id,
        session.workspace.id,
      ))
    ) {
      return NextResponse.json(
        { error: "Saved view not found" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete saved view", error);
    return NextResponse.json(
      { error: "Saved view could not be deleted" },
      { status: 500 },
    );
  }
}
