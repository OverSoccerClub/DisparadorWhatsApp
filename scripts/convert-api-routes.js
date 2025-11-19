const fs = require('fs');
const path = require('path');

// Script para converter API routes de App Router para Pages Router

const apiDir = path.join(__dirname, '..', 'pages', 'api');

function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar se já está convertido
  if (content.includes('NextApiRequest') && content.includes('NextApiResponse')) {
    console.log(`✅ Já convertido: ${filePath}`);
    return;
  }
  
  // Verificar se precisa conversão
  if (!content.includes('next/headers') && !content.includes('NextRequest')) {
    console.log(`⏭️  Não precisa: ${filePath}`);
    return;
  }
  
  console.log(`🔄 Convertendo: ${filePath}`);
  
  let newContent = content;
  
  // Substituir imports
  newContent = newContent.replace(
    /import { NextRequest, NextResponse } from 'next\/server'/g,
    "import type { NextApiRequest, NextApiResponse } from 'next'"
  );
  
  newContent = newContent.replace(
    /import { cookies } from 'next\/headers'/g,
    ''
  );
  
  // Substituir função handler
  newContent = newContent.replace(
    /export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest\)/g,
    'export default async function handler(\n  req: NextApiRequest,\n  res: NextApiResponse\n)'
  );
  
  // Adicionar verificação de método
  const methodMatch = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)/);
  if (methodMatch) {
    const method = methodMatch[1];
    newContent = newContent.replace(
      'export default async function handler(\n  req: NextApiRequest,\n  res: NextApiResponse\n)',
      `export default async function handler(\n  req: NextApiRequest,\n  res: NextApiResponse\n) {\n  if (req.method !== '${method}') {\n    return res.status(405).json({ success: false, message: 'Method not allowed' })\n  }\n`
    );
    
    // Adicionar } extra no final
    newContent = newContent.replace(/}\s*$/, '}\n}');
  }
  
  // Substituir request.json() por req.body
  newContent = newContent.replace(/const body = await request\.json\(\)/g, 'const { body } = req');
  newContent = newContent.replace(/await request\.json\(\)/g, 'req.body');
  
  // Substituir NextResponse.json
  newContent = newContent.replace(
    /return NextResponse\.json\(\s*([^,]+),\s*{\s*status:\s*(\d+)\s*}\s*\)/g,
    'return res.status($2).json($1)'
  );
  
  newContent = newContent.replace(
    /return NextResponse\.json\(\s*([^)]+)\s*\)/g,
    'return res.status(200).json($1)'
  );
  
  // Remover await cookies()
  newContent = newContent.replace(/const cookieStore = await cookies\(\)/g, '');
  newContent = newContent.replace(/cookieStore\./g, 'req.cookies.');
  
  // Limpar linhas vazias múltiplas
  newContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(filePath, newContent);
  console.log(`✅ Convertido: ${filePath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      try {
        convertFile(filePath);
      } catch (error) {
        console.error(`❌ Erro em ${filePath}:`, error.message);
      }
    }
  });
}

console.log('🚀 Iniciando conversão de API routes...\n');
walkDir(apiDir);
console.log('\n✅ Conversão concluída!');

