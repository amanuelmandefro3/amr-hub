import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../../prisma/client";

const createIssueSchema = z.object({
  title: z.string().trim().min(4).max(255),
  description: z.string().trim().min(12).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const validation = createIssueSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const newIssue = await prisma.issue.create({
      data: validation.data,
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    console.error("Failed to create issue", error);
    return NextResponse.json(
      { error: "Issue could not be created" },
      { status: 500 },
    );
  }
}
