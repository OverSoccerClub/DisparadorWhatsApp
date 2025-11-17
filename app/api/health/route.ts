import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health Check Endpoint
 * 
 * Verifica o status de saúde do sistema, incluindo:
 * - Conexão com Supabase
 * - Status do banco de dados
 * - Variáveis de ambiente críticas
 */

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  checks: {
    database: {
      status: 'ok' | 'error'
      message?: string
      responseTime?: number
    }
    environment: {
      status: 'ok' | 'error'
      missing?: string[]
    }
    api: {
      status: 'ok'
    }
  }
  version: string
}

async function checkDatabase(): Promise<{ status: 'ok' | 'error'; message?: string; responseTime?: number }> {
  const startTime = Date.now()
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: 'error',
        message: 'Variáveis de ambiente do Supabase não configuradas',
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Teste simples de conexão
    const { error } = await supabase.from('clientes').select('id').limit(1)
    
    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'error',
        message: error.message,
        responseTime,
      }
    }

    return {
      status: 'ok',
      responseTime,
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Erro desconhecido ao conectar com o banco',
      responseTime: Date.now() - startTime,
    }
  }
}

function checkEnvironment(): { status: 'ok' | 'error'; missing?: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    return {
      status: 'error',
      missing,
    }
  }

  return {
    status: 'ok',
  }
}

export async function GET() {
  try {
    const [databaseCheck, environmentCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkEnvironment()),
    ])

    const allChecksOk = 
      databaseCheck.status === 'ok' && 
      environmentCheck.status === 'ok'

    const status: HealthCheck['status'] = allChecksOk
      ? 'healthy'
      : databaseCheck.status === 'error' && environmentCheck.status === 'error'
      ? 'unhealthy'
      : 'degraded'

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseCheck,
        environment: environmentCheck,
        api: {
          status: 'ok',
        },
      },
      version: process.env.npm_package_version || '0.1.5',
    }

    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: httpStatus })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Erro ao verificar saúde do sistema',
      },
      { status: 503 }
    )
  }
}

