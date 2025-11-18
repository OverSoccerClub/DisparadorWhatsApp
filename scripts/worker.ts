#!/usr/bin/env node

// Worker entrypoint - importa o módulo de filas para registrar processadores
// Rodar com: ts-node -r tsconfig-paths/register scripts/worker.ts

import '@/lib/queue'

console.log('🔧 Worker: filas registradas e aguardando jobs...')

// Manter o processo vivo
process.stdin.resume()

process.on('SIGINT', () => {
  console.log('✋ Worker recebido SIGINT - finalizando')
  process.exit(0)
})
