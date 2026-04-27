import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // iron-session needs a Request/Response pair in edge-compatible environments.
  // In Next.js proxy we use the request directly.
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.shop) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', 'dashboard')
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
