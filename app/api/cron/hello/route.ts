import type { NextRequest } from "next/server";

import { env } from "@/core/data/env/server";

export function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  return new Response("Hello from Vercel!");
}
