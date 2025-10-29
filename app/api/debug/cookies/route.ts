import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    return NextResponse.json({
      success: true,
      cookies: allCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 20) + '...' // Mostrar apenas início por segurança
      })),
      count: allCookies.length,
      hasSupabaseCookies: allCookies.some(c => c.name.includes('sb-'))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    })
  }
}

