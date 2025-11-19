"use strict";
// Script para criar a tabela waha_config no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas');
    console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
async function createWahaConfigTable() {
    console.log('🔧 Criando tabela waha_config...');
    const sql = `
    -- Criar tabela waha_config
    CREATE TABLE IF NOT EXISTS public.waha_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        api_url TEXT NOT NULL,
        api_key TEXT,
        webhook_url TEXT,
        webhook_secret TEXT,
        timeout INTEGER DEFAULT 30,
        retry_attempts INTEGER DEFAULT 3,
        rate_limit INTEGER DEFAULT 100,
        enable_auto_reconnect BOOLEAN DEFAULT true,
        enable_qr_code BOOLEAN DEFAULT true,
        enable_presence BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        CONSTRAINT waha_config_id_check CHECK (id = 1)
    );

    -- Habilitar RLS
    ALTER TABLE public.waha_config ENABLE ROW LEVEL SECURITY;

    -- Políticas de acesso
    DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.waha_config;
    CREATE POLICY "Permitir leitura para todos" ON public.waha_config
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON public.waha_config;
    CREATE POLICY "Permitir atualização para autenticados" ON public.waha_config
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON public.waha_config;
    CREATE POLICY "Permitir inserção para autenticados" ON public.waha_config
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
  `;
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error('❌ Erro ao criar tabela:', error);
            console.log('\n📝 Execute o SQL manualmente no Supabase SQL Editor:');
            console.log('1. Acesse: https://supabase.com/dashboard');
            console.log('2. Vá em SQL Editor');
            console.log('3. Cole o conteúdo do arquivo: scripts/create-waha-config-table.sql');
            console.log('4. Execute');
            return;
        }
        console.log('✅ Tabela criada com sucesso!');
        // Inserir configuração padrão
        console.log('📝 Inserindo configuração padrão...');
        const { error: insertError } = await supabase
            .from('waha_config')
            .upsert({
            id: 1,
            api_url: 'http://localhost:3001',
            api_key: ''
        }, { onConflict: 'id' });
        if (insertError) {
            console.error('⚠️ Aviso ao inserir configuração:', insertError.message);
        }
        else {
            console.log('✅ Configuração padrão inserida!');
        }
        // Verificar
        const { data, error: selectError } = await supabase
            .from('waha_config')
            .select('*')
            .single();
        if (selectError) {
            console.error('⚠️ Erro ao verificar:', selectError.message);
        }
        else {
            console.log('✅ Verificação bem-sucedida!');
            console.log('📊 Configuração atual:', data);
        }
    }
    catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n📝 Execute o SQL manualmente no Supabase SQL Editor:');
        console.log('Arquivo: scripts/create-waha-config-table.sql');
    }
}
console.log('🚀 Iniciando setup do WAHA...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('');
createWahaConfigTable()
    .then(() => {
    console.log('\n🎉 Setup concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Instalar WAHA: docker run -d -p 3001:3000 --name waha devlikeapro/waha');
    console.log('2. Criar .env.local com: WAHA_API_URL=http://localhost:3001');
    console.log('3. Reiniciar servidor: npm run dev');
})
    .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
