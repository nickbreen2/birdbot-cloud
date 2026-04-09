import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Only the dashboard requires authentication.
// Everything else (landing, sign-in/up, API routes, OG image, 404, etc.) is public.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
}, {
  // Proxy Clerk's frontend API through our own domain to fix iOS Safari ITP.
  // Without this, iOS blocks the cross-site cookie from clerk.accounts.dev.
  frontendApiProxy: { enabled: true },
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
