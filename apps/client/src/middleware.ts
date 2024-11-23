import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAuthRoute = path.startsWith('/auth/')
  const isProtectedRoute = !isAuthRoute

  const token = cookies().get('token')
  const redirectToHome = NextResponse.redirect(new URL('/', req.nextUrl))
  const redirectToLogin = NextResponse.redirect(new URL('/auth/login', req.nextUrl))

  if (token) {
    const checkAuthRequest = new NextRequest(new URL('/api/auth/check-auth', process.env.API_BASE_URL!))
    checkAuthRequest.cookies.set('token', token.value)

    const res = await fetch(checkAuthRequest)
    const { valid } = await res.json()

    if (valid && isAuthRoute) return redirectToHome
    if (!valid && isProtectedRoute) return redirectToLogin
  } else if (isProtectedRoute) {
    return redirectToLogin
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*|_next).*)'],
}
