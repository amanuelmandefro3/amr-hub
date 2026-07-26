import { NextResponse } from "next/server";
import { listLabels } from "../../../server/issues";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listLabels());
  } catch (error) {
    console.error("Failed to load labels", error);
    return NextResponse.json(
      { error: "Labels could not be loaded" },
      { status: 500 },
    );
  }
}
