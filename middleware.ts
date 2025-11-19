import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // INTERCEPTAR requisições de hot-update e retornar 200 vazio (evita loop infinito)
  if (pathname.includes('webpack.hot-update.json') || pathname.includes('hot-update')) {
    return new NextResponse(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Permitir acesso direto a arquivos estáticos e recursos do Next.js
  // Verificar se é um arquivo estático (com extensão) ou recurso do Next.js
  const isStaticFile = pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|json)$/)
  const isNextStatic = pathname.startsWith('/_next/') // Inclui static, image, webpack, etc
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicStatic = pathname.startsWith('/img/') || pathname.startsWith('/favicon.ico')
  
  // Retornar imediatamente para recursos estáticos sem processar autenticação
  if (isNextStatic || isApiRoute || isPublicStatic || isStaticFile) {
    return NextResponse.next()
  }

  const legacyToken = request.cookies.get('auth-token')?.value
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(c => c.name.includes('sb-') && c.name.endsWith('auth-token'))

  // Rotas que não precisam de autenticação
  const publicRoutes = ['/auth', '/debug', '/debug-auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/'

  // Adicionar header com pathname para o layout usar
  const response = isPublicRoute 
    ? NextResponse.next()
    : (!legacyToken && !hasSupabaseAuthCookie)
      ? NextResponse.redirect(new URL('/auth', request.url))
      : NextResponse.next()

  // Adicionar header com pathname
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (all Next.js internal routes - static, image, webpack, etc)
     * - favicon.ico (favicon file)
     * - img (public images folder)
     * - static files
     */
    '/((?!api|_next|favicon.ico|img|.*\\..*$).*)',
  ],
}

