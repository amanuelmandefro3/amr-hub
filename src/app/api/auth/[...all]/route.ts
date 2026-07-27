import { toNextJsHandler } from "better-auth/next-js";
import prisma from "../../../../../prisma/client";
import { auth } from "../../../../lib/auth";
import { isValidBootstrapToken } from "../../../../server/bootstrap";
import { loadServerEnvironment } from "../../../../server/env";

const handlers = toNextJsHandler(auth);
const environment = loadServerEnvironment();

export const GET = handlers.GET;

export async function POST(request: Request) {
  const isOwnerSetup = new URL(request.url).pathname.endsWith("/sign-up/email");

  if (isOwnerSetup) {
    const userCount = await prisma.user.count();
    const suppliedToken = request.headers.get("x-bootstrap-token");

    if (
      userCount > 0 ||
      !isValidBootstrapToken(
        suppliedToken,
        environment.AUTH_BOOTSTRAP_TOKEN,
      )
    ) {
      return Response.json(
        { message: "Workspace owner setup is unavailable" },
        {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  }

  return handlers.POST(request);
}
