// middleware.js
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/home(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect unauthenticated users away from protected routes
  if (!userId && isProtectedRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Apply to all routes except static assets and Next.js internals
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
