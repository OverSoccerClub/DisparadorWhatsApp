#!/bin/bash

# Script para limpar arquivos de deploys anteriores no EasyPanel
# 
# Este script remove arquivos e diretórios que não são mais necessários
# após um deploy, evitando acúmulo de arquivos no servidor

echo "🧹 Iniciando limpeza de arquivos de deploys anteriores..."

# Diretório base (ajustar conforme necessário)
BASE_DIR="${1:-/app}"

# Lista de diretórios/arquivos para limpar
CLEANUP_PATHS=(
  ".next/cache"
  ".next/trace"
  "node_modules/.cache"
  ".turbo"
  ".cache"
  "*.log"
  "*.log.*"
  "npm-debug.log*"
  "yarn-debug.log*"
  "yarn-error.log*"
  ".DS_Store"
  "Thumbs.db"
  "*.tmp"
  "*.temp"
  "sessions/*"
  "dist"
  "coverage"
  ".nyc_output"
)

# Limpar cada item
for path in "${CLEANUP_PATHS[@]}"; do
  if [ -e "$BASE_DIR/$path" ] || [ -f "$BASE_DIR/$path" ] || [ -d "$BASE_DIR/$path" ]; then
    echo "  🗑️  Removendo: $path"
    rm -rf "$BASE_DIR/$path" 2>/dev/null || true
  fi
done

# Limpar arquivos de log antigos (mais de 7 dias)
find "$BASE_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# Limpar arquivos temporários
find "$BASE_DIR" -name "*.tmp" -type f -delete 2>/dev/null || true
find "$BASE_DIR" -name "*.temp" -type f -delete 2>/dev/null || true

echo "✅ Limpeza concluída!"

