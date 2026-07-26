import { NextRequest, NextResponse } from "next/server";
import { updateIssueSchema } from "../../../../server/issueSchemas";
import {
  UnknownLabelError,
  updateIssue,
} from "../../../../server/issues";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const validation = updateIssueSchema.safeParse(await request.json());

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
    const issue = await updateIssue(id, validation.data);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    if (error instanceof UnknownLabelError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update issue", error);
    return NextResponse.json(
      { error: "Issue could not be updated" },
      { status: 500 },
    );
  }
}
