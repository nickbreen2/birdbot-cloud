import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/support(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/api/waitlist(.*)',
  '/sitemap(.*)',
  '/opengraph-image(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jld?|cj?s|mj?s|ttf|otf|woff2?|ico|png|jpg|jpeg|gif|svg|webp|avif|mp4|webm|ogg|mp3|wav|flac|aac)).*)',
    '/(api|trpc)(.*)',
  ],
}
