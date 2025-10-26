import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ENABLED } from "@/utils/auth";

/* eslint-disable @typescript-eslint/no-var-requires */
let clerkExports: any = null;

if (AUTH_ENABLED) {
  clerkExports = require("@clerk/nextjs/server");
}

const isProtectedRoute =
  AUTH_ENABLED && clerkExports
    ? clerkExports.createRouteMatcher([
        "/ledger(.*)",
        "/review(.*)",
        "/dashboard(.*)",
      ])
    : () => false;

const isPublicRoute =
  AUTH_ENABLED && clerkExports
    ? clerkExports.createRouteMatcher([
        "/",
        "/sign-in(.*)",
        "/sign-up(.*)",
        "/blog(.*)",
        "/api/waiting-list(.*)",
        "/api/health",
        "/api/link",
        "/api/stripe/create-checkout",
        "/api/stripe/create-portal",
        "/api/webhook/:path*",
        "/waiting-list(.*)",
        "/privacy-policy(.*)",
        "/tos(.*)",
        "/success(.*)",
      ])
    : () => true;

const handler = AUTH_ENABLED
  ? clerkExports!.clerkMiddleware((auth: any, request: NextRequest) => {
      if (isPublicRoute(request)) {
        return;
      }

      if (isProtectedRoute(request)) {
        auth().protect();
      }
    })
  : (() => NextResponse.next());

export default handler;

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
