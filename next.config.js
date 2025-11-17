/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // Compressão e otimizações
  compress: true,
  poweredByHeader: false,
  
  // TypeScript - Em produção, manter verificação (comentado para desenvolvimento rápido)
  // Para produção, recomenda-se habilitar verificação de tipos
  typescript: {
    ignoreBuildErrors: !isProduction, // false em produção, true em desenvolvimento
  },
  
  // ESLint - Em produção, manter verificação (comentado para desenvolvimento rápido)
  // Para produção, recomenda-se habilitar verificação de lint
  eslint: {
    ignoreDuringBuilds: !isProduction, // false em produção, true em desenvolvimento
  },
  
  // SWC Minify para melhor performance
  swcMinify: true,
  
  // React Strict Mode para detectar problemas
  reactStrictMode: true,
  
  // Output standalone para Docker (apenas em produção)
  output: isProduction ? 'standalone' : undefined,
  
  // Configurações de imagem otimizadas
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  
  // Configurações experimentais para performance
  experimental: {
    optimizeCss: true,
  },
  
  // Headers de segurança e performance
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ]

    // Adicionar headers adicionais em produção
    if (isProduction) {
      securityHeaders.push(
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://supabase.innovarecode.com.br",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        }
      )
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache para arquivos estáticos
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache para assets do Next.js
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
