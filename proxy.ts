import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/next";
import { NextRequest, NextResponse } from "next/server";

import { env } from "./core/data/env/server";
import { routes } from "./core/data/routes";

//** Public routes that don't require authentication
const EXACT_PUBLIC_ROUTES = ["/"];
const PREFIX_PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

//** Check if route is public */
function isPublicRoute(pathname: string): boolean {
  if (EXACT_PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  return PREFIX_PUBLIC_ROUTES.some((route) => {
    if (pathname === route) {
      return true;
    }

    return pathname.startsWith(`${route}/`);
  });
}

/**
 * Arcjet should primarily protect API surfaces.
 * Page navigations are protected by session auth checks below.
 */
function shouldRunArcjet(pathname: string): boolean {
  // Stripe routes can be noisy and are validated in their own handlers.
  if (pathname.startsWith("/api/stripe/")) {
    return false;
  }

  return pathname.startsWith("/api") || pathname.startsWith("/trpc");
}

//** Arcjet instance */
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
  const { pathname } = req.nextUrl;

  // Skip Arcjet and auth for Stripe webhooks; they use signature verification in the route.
  if (pathname === "/api/stripe/webhooks") {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Arcjet protection for API/TRPC traffic only.
  if (shouldRunArcjet(pathname)) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return new Response(null, { status: 403 });
    }
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
