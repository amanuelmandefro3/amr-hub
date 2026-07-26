import { NextResponse } from "next/server";
import { listCycles } from "../../../server/cycles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listCycles());
  } catch (error) {
    console.error("Failed to load cycles", error);
    return NextResponse.json(
      { error: "Cycles could not be loaded" },
      { status: 500 },
    );
  }
}
