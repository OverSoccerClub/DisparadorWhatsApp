# Dockerfile otimizado para produção
FROM node:20-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependências de produção
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build da aplicação
FROM base AS builder
WORKDIR /app
# Limpar diretório completamente antes de começar (evita acúmulo de arquivos)
RUN rm -rf * .[^.]* 2>/dev/null || true
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Limpar arquivos desnecessários após copiar (evita acúmulo no build)
RUN rm -rf .next/cache .next/trace node_modules/.cache .turbo .cache *.log *.log.* sessions dist coverage .nyc_output 2>/dev/null || true

# Build otimizado para produção
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]