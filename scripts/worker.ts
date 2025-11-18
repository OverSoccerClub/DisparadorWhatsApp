#!/usr/bin/env node

// Worker entrypoint - importa o módulo de filas para registrar processadores
// Rodar com: ts-node -r tsconfig-paths/register scripts/worker.ts
// Compilado para produção com: npm run build:worker && npm run worker:prod

// Import usando caminho relativo para permitir compilação para dist/ sem depender de
// resolução de paths em tempo de execução.
import '../lib/queue'

console.log('🔧 Worker: filas registradas e aguardando jobs...')

// Manter o processo vivo
process.stdin.resume()

process.on('SIGINT', () => {
  console.log('✋ Worker recebido SIGINT - finalizando')
  process.exit(0)
})
