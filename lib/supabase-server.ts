import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cria um cliente Supabase com configuração correta de cookies (usando getAll/setAll)
 * Esta função corrige os avisos do @supabase/ssr sobre métodos deprecados
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const response = new NextResponse()
  
  return {
    supabase: createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set({
                  name,
                  value,
                  ...options,
                  sameSite: 'lax',
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production'
                })
              })
            } catch (error) {
              // Silenciar erro de cookies se não for possível definir
            }
          },
        },
      }
    ),
    response
  }
}

/**
 * Cria um cliente Supabase apenas para leitura (sem resposta para definir cookies)
 * Use apenas quando não precisar autenticar ou atualizar cookies
 */
export async function createSupabaseReadOnlyClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Não fazer nada - apenas leitura
        },
      },
    }
  )
}

