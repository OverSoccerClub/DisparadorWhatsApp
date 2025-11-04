/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção otimizadas (apenas em produção)
  // output: 'standalone', // Removido temporariamente para evitar problemas de chunking
  
  // Compressão e otimizações
  compress: true,
  poweredByHeader: false,
  
  // Desabilitar verificação de tipos durante o build (para produção rápida)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Desabilitar ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configurações de imagem otimizadas
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  
  // Removido override de webpack para estabilizar o build
  
  // Configurações experimentais para performance (simplificadas para estabilidade)
  experimental: {
    optimizeCss: true,
    // optimizePackageImports removido temporariamente para evitar quebras de chunk
  },
  
  // Forçar App Router (evitar confusão com Pages Router)
  // Não há configuração específica necessária - o Next.js detecta automaticamente pela estrutura app/
  
  // Headers de segurança e performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
        ],
      },
      // Deixar o Next gerenciar Content-Type de assets estáticos
      {
        source: '/static/(.*)',
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
