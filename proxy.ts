import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Embedded route: require shop + host query params (App Bridge handles auth)
  if (pathname.startsWith('/embedded')) {
    const shop = request.nextUrl.searchParams.get('shop')
    const host = request.nextUrl.searchParams.get('host')
    if (!shop || !host) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Dashboard route: require iron-session cookie
  if (pathname.startsWith('/dashboard')) {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    if (!session.shop) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', 'dashboard')
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/embedded/:path*'],
}
