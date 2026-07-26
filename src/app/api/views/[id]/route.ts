import { NextResponse } from "next/server";
import { deleteSavedView } from "../../../../server/savedViews";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!(await deleteSavedView(id))) {
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
