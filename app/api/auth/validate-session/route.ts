import { NextResponse } from "next/server";

import { getSessionByToken } from "@/core/features/auth/session";
import {
  deleteSessionCookie,
  getSessionToken,
} from "@/core/features/auth/cookies";
import { routes } from "@/core/data/routes";

export async function GET(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.redirect(new URL(routes.landing, request.url));
  }

  const session = await getSessionByToken(token);

  if (!session) {
    await deleteSessionCookie();
    return NextResponse.redirect(new URL(routes.landing, request.url));
  }

  return NextResponse.redirect(new URL(routes.app, request.url));
}
