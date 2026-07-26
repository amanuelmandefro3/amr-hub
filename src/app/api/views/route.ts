import { NextRequest, NextResponse } from "next/server";
import { savedViewSchema } from "../../../server/savedViewSchemas";
import {
  createSavedView,
  DuplicateSavedViewError,
  listSavedViews,
} from "../../../server/savedViews";
import { UnknownLabelError } from "../../../server/issues";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listSavedViews());
  } catch (error) {
    console.error("Failed to load saved views", error);
    return NextResponse.json(
      { error: "Saved views could not be loaded" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = savedViewSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(await createSavedView(validation.data), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    if (
      error instanceof DuplicateSavedViewError ||
      error instanceof UnknownLabelError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to create saved view", error);
    return NextResponse.json(
      { error: "Saved view could not be created" },
      { status: 500 },
    );
  }
}
