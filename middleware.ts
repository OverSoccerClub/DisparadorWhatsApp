import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir acesso direto a arquivos estáticos e recursos do Next.js
  // Verificar se é um arquivo estático (com extensão) ou recurso do Next.js
  const isStaticFile = pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|json)$/)
  const isNextStatic = pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image')
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicStatic = pathname.startsWith('/img/') || pathname.startsWith('/favicon.ico')
  
  if (isNextStatic || isApiRoute || isPublicStatic || isStaticFile) {
    return NextResponse.next()
  }

  const legacyToken = request.cookies.get('auth-token')?.value
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(c => c.name.includes('sb-') && c.name.endsWith('auth-token'))

  // Rotas que não precisam de autenticação
  const publicRoutes = ['/auth', '/debug', '/debug-auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Se for uma rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Se não há token e não é rota pública, redirecionar para login
  if (!legacyToken && !hasSupabaseAuthCookie) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Se há token, permitir acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack (webpack chunks)
     * - favicon.ico (favicon file)
     * - img (public images folder)
     */
    '/((?!api|_next/static|_next/image|_next/webpack|favicon.ico|img/).*)',
  ],
}

