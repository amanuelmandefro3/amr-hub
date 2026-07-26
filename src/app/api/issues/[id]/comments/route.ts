import { NextRequest, NextResponse } from "next/server";
import { createCommentSchema } from "../../../../../server/issueSchemas";
import { addComment } from "../../../../../server/issues";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const validation = createCommentSchema.safeParse(await request.json());

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
    const issue = await addComment(id, validation.data.body);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    console.error("Failed to add comment", error);
    return NextResponse.json(
      { error: "Comment could not be added" },
      { status: 500 },
    );
  }
}
