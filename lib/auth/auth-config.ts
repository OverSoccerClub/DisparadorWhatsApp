// Configuração de autenticação
export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

// Verificar se as variáveis estão configuradas
export function validateAuthConfig() {
  const errors = []
  
  if (!authConfig.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL não configurada')
  }
  
  if (!authConfig.supabaseKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada')
  }
  
  if (authConfig.jwtSecret === 'default-secret-key-change-in-production') {
    console.warn('⚠️ JWT_SECRET usando valor padrão. Configure uma chave segura em produção.')
  }
  
  return errors
}

