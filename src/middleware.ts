import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/create-checkout-session',
  '/api/webhook/:path*',
  '/dashboard',
  '/api/waiting-list',
  '/waiting-list',
  '/blog',
  '/blog(.*)',
  '/sitemap.xml',
  '/processing-page(.*)',
  '/images/:path*' // Allow access to all files in the images directory
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)',
  ],
};