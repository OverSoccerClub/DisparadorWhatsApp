// test-env.js
require('dotenv').config();

console.log('Testando variáveis de ambiente:');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Carregada' : '❌ Não carregada');
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Carregada' : '❌ Não carregada');
console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Carregada' : '❌ Não carregada');
console.log('Node ENV:', process.env.NODE_ENV || '❌ Não definida');
console.log('Gemini Key Length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('Gemini Key (primeiros 10 chars):', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'Não encontrada');
