import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Cookies antigos removidos com sucesso'
    })

    // Remover cookies antigos do sistema custom
    response.cookies.set('auth-token', '', {
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('refresh-token', '', {
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}

