#!/bin/bash

# Script para limpar completamente o cache do Next.js e resolver problemas de ChunkLoadError

echo "🧹 Limpando cache completo do Next.js..."

# Parar processos Node.js
echo "🛑 Parando processos Node.js..."
pkill -f node || true

# Limpar cache do Next.js
echo "🗑️ Removendo pasta .next..."
rm -rf .next

# Limpar node_modules
echo "🗑️ Removendo node_modules..."
rm -rf node_modules

# Limpar package-lock.json
echo "🗑️ Removendo package-lock.json..."
rm -f package-lock.json

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Limpar cache do sistema (Windows)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🧹 Limpando cache do sistema Windows..."
    # Limpar cache do Windows
    del /q /s "%TEMP%\*" 2>nul || true
fi

# Reinstalar dependências
echo "📦 Reinstalando dependências..."
npm install

echo "✅ Limpeza completa finalizada!"
echo "🚀 Execute 'npm run dev' para iniciar o servidor"
