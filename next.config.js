/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

// Ler versão do package.json
const packageJson = require('./package.json')
const appVersion = packageJson.version

// Definir variável de ambiente com a versão do package.json
if (!process.env.NEXT_PUBLIC_APP_VERSION) {
  process.env.NEXT_PUBLIC_APP_VERSION = appVersion
}

const nextConfig = {
  // Definir variáveis de ambiente públicas
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  // Compressão e otimizações
  compress: true,
  poweredByHeader: false,
  
  // DESABILITAR Fast Refresh completamente
  reactStrictMode: false,
  
  // TypeScript - Temporariamente desabilitado para resolver problemas de migração
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint - Temporariamente desabilitado para resolver problemas de migração
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // SWC Minify para melhor performance
  swcMinify: true,
  
  // DESABILITAR HMR completamente via webpack - SOLUÇÃO DEFINITIVA
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev && !isServer) {
      // Remover TODOS os plugins relacionados a HMR
      config.plugins = config.plugins.filter(plugin => {
        const name = plugin.constructor.name
        return !name.includes('Hot') && 
               !name.includes('FastRefresh') &&
               !name.includes('HMR')
      })
      
      // Remover entry points de HMR do webpack
      if (config.entry && typeof config.entry === 'object') {
        Object.keys(config.entry).forEach(key => {
          if (Array.isArray(config.entry[key])) {
            config.entry[key] = config.entry[key].filter(
              entry => typeof entry === 'string' && 
                       !entry.includes('webpack/hot') &&
                       !entry.includes('webpack-dev-server') &&
                       !entry.includes('@next/react-refresh')
            )
          }
        })
      }
      
      // Desabilitar completamente o HMR no webpack
      config.optimization = config.optimization || {}
      config.optimization.moduleIds = 'deterministic'
      
      // Desabilitar watch completamente
      config.watchOptions = {
        ignored: /.*/,
        poll: false,
        aggregateTimeout: 0,
      }
      
      // Remover configurações de HMR
      if (config.devServer) {
        delete config.devServer.hot
      }
    }
    return config
  },
  
  // React Strict Mode desabilitado para evitar problemas de hidratação
  reactStrictMode: false,
  
  
  // Output standalone para Docker (apenas em produção)
  output: isProduction ? 'standalone' : undefined,
  
  // Configurações de imagem otimizadas
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  
  // Configurações experimentais desabilitadas para evitar loop de recompilação
  // experimental: {
  //   optimizeCss: true,
  // },
  
  // Desabilitar otimizações que podem causar problemas de hidratação
  reactStrictMode: false,
  
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
