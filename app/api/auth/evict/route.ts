import { NextRequest, NextResponse } from "next/server";

import { routes } from "@/core/data/routes";
import { deleteSessionCookie } from "@/core/features/auth/cookies";

export async function GET(request: NextRequest) {
  await deleteSessionCookie();

  const redirectUrl = new URL(routes.landing, request.url);
  return NextResponse.redirect(redirectUrl);
}
