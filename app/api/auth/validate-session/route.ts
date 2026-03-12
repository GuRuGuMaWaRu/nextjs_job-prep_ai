import { NextResponse } from "next/server";

import { validateSessionAction } from "@/core/features/auth/actions";
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

  const isValid = await validateSessionAction(token);

  if (!isValid) {
    await deleteSessionCookie();
    return NextResponse.redirect(new URL(routes.landing, request.url));
  }

  return NextResponse.redirect(new URL(routes.app, request.url));
}
