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
  
  // Configurações de webpack para corrigir problemas de chunking do Supabase
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Desabilitar splitChunks para evitar problemas com vendor-chunks do Supabase
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      }
      
      // Garantir que @supabase/ssr seja resolvido corretamente
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/ssr': require.resolve('@supabase/ssr'),
      }
    }
    
    return config
  },
  
  // Configurações experimentais para performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
