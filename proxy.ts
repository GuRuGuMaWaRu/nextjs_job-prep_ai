import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextRequest, NextResponse } from "next/server";

import { env } from "./core/data/env/server";
import { routes } from "./core/data/routes";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/auth/verify-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/",
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

const aj = arcjet({
  // TODO: add ts for env vars
  key: env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    }),
  ],
});

export default async function middleware(req: NextRequest) {
  // TODO: the proposed idea is not to call arcJet when we try to create a new interview
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return new Response(null, { status: 403 });
  }

  const { pathname } = req.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session token in cookies
  const sessionToken = req.cookies.get("session_token")?.value;

  if (!sessionToken) {
    // Redirect to sign in if no session token
    const signInUrl = new URL(routes.signIn, req.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Session validation happens in server components via getCurrentUser()
  // We just check for token presence here for performance
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
