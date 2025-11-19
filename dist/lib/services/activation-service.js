"use strict";
/**
 * Serviço de geração e validação de códigos de ativação
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivationCode = createActivationCode;
exports.validateActivationCode = validateActivationCode;
exports.checkEmailExists = checkEmailExists;
exports.checkPhoneExists = checkPhoneExists;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Validar variáveis de ambiente
if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida nas variáveis de ambiente');
}
// Usar SERVICE_ROLE_KEY se disponível, caso contrário usar ANON_KEY (com limitações)
// Verificar se SERVICE_ROLE_KEY não é apenas um placeholder
const hasValidServiceKey = supabaseServiceKey &&
    supabaseServiceKey !== 'your_supabase_service_role_key_here' &&
    supabaseServiceKey.trim() !== '';
const supabaseKey = hasValidServiceKey ? supabaseServiceKey : supabaseAnonKey;
if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY deve estar definida nas variáveis de ambiente');
}
// Avisar se estiver usando ANON_KEY em vez de SERVICE_ROLE_KEY (apenas em desenvolvimento)
if (!hasValidServiceKey && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ activation-service: Usando ANON_KEY. Algumas operações admin podem não funcionar. Configure SUPABASE_SERVICE_ROLE_KEY para funcionalidade completa.');
}
// Criar cliente Supabase
// Nota: SERVICE_ROLE_KEY permite operações admin, ANON_KEY tem limitações
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
/**
 * Gera um código único de ativação (6 dígitos)
 */
function generateActivationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Cria um código de ativação para um usuário
 */
async function createActivationCode(userId, email) {
    try {
        const code = generateActivationCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expira em 24 horas
        const { data, error } = await supabase
            .from('activation_codes')
            .insert({
            user_id: userId,
            email: email,
            code: code,
            expires_at: expiresAt.toISOString(),
            used: false
        })
            .select()
            .single();
        if (error) {
            console.error('Erro ao criar código de ativação:', error);
            return { success: false, error: error.message };
        }
        return { success: true, code };
    }
    catch (error) {
        console.error('Erro ao criar código de ativação:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Valida e ativa um código de ativação
 */
async function validateActivationCode(email, code) {
    try {
        // Buscar código de ativação
        const { data, error } = await supabase
            .from('activation_codes')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .eq('used', false)
            .single();
        if (error || !data) {
            return { success: false, error: 'Código de ativação inválido' };
        }
        // Verificar se o código expirou
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            return { success: false, error: 'Código de ativação expirado' };
        }
        // Marcar código como usado
        await supabase
            .from('activation_codes')
            .update({ used: true })
            .eq('id', data.id);
        // Ativar usuário no Supabase Auth (confirmar email)
        // Nota: Esta operação requer SERVICE_ROLE_KEY
        if (!hasValidServiceKey) {
            console.warn('⚠️ validateActivationCode: SERVICE_ROLE_KEY não configurada. Não é possível ativar usuário automaticamente.');
            // Retornar sucesso mesmo sem ativar, pois o código foi validado
            // O endpoint /api/auth/activate tentará ativar novamente
            return { success: true, userId: data.user_id };
        }
        // Confirmar email do usuário (ativar conta)
        // Usar email_confirmed_at diretamente via updateUserById
        // @ts-ignore - email_confirmed_at pode não estar no tipo mas funciona na API
        const { error: updateError } = await supabase.auth.admin.updateUserById(data.user_id, {
            // @ts-ignore
            email_confirmed_at: new Date().toISOString()
        });
        if (updateError) {
            console.error('Erro ao ativar usuário:', updateError);
            // Retornar sucesso mesmo assim - código foi validado
            // O endpoint /api/auth/activate tentará ativar novamente
            return { success: true, userId: data.user_id };
        }
        console.log('✅ Usuário ativado com sucesso:', data.user_id);
        return { success: true, userId: data.user_id };
    }
    catch (error) {
        console.error('Erro ao validar código de ativação:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Verifica se um email já está cadastrado
 */
async function checkEmailExists(email) {
    try {
        // Esta operação requer SERVICE_ROLE_KEY
        if (!hasValidServiceKey) {
            // Retornar false e deixar o Supabase Auth lidar com duplicatas
            return false;
        }
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
            // Se houver erro de autenticação, retornar false e deixar o Supabase Auth lidar
            if (error.message?.includes('Invalid authentication') || error.message?.includes('credentials')) {
                console.debug('checkEmailExists: Credenciais inválidas, retornando false');
                return false;
            }
            console.error('Erro ao verificar email:', error);
            return false;
        }
        return data.users.some(user => user.email === email);
    }
    catch (error) {
        // Se houver erro de autenticação, retornar false e deixar o Supabase Auth lidar
        if (error?.message?.includes('Invalid authentication') || error?.message?.includes('credentials')) {
            console.debug('checkEmailExists: Credenciais inválidas, retornando false');
            return false;
        }
        console.error('Erro ao verificar email:', error);
        return false;
    }
}
/**
 * Verifica se um telefone já está cadastrado
 */
async function checkPhoneExists(phone) {
    try {
        // Esta operação requer SERVICE_ROLE_KEY
        if (!hasValidServiceKey) {
            // Retornar false e deixar o Supabase Auth lidar com duplicatas
            return false;
        }
        // Normalizar telefone (remover caracteres não numéricos)
        const normalizedPhone = phone.replace(/\D/g, '');
        // Buscar em user_metadata do Supabase Auth
        const { data: users, error } = await supabase.auth.admin.listUsers();
        if (error) {
            // Se houver erro de autenticação, retornar false e deixar o Supabase Auth lidar
            if (error.message?.includes('Invalid authentication') || error.message?.includes('credentials')) {
                console.debug('checkPhoneExists: Credenciais inválidas, retornando false');
                return false;
            }
            console.error('Erro ao verificar telefone:', error);
            return false;
        }
        // Verificar se algum usuário tem este telefone no metadata
        return users.users.some(user => {
            const userPhone = user.user_metadata?.phone;
            return userPhone && userPhone.replace(/\D/g, '') === normalizedPhone;
        });
    }
    catch (error) {
        // Se houver erro de autenticação, retornar false e deixar o Supabase Auth lidar
        if (error?.message?.includes('Invalid authentication') || error?.message?.includes('credentials')) {
            console.debug('checkPhoneExists: Credenciais inválidas, retornando false');
            return false;
        }
        console.error('Erro ao verificar telefone:', error);
        return false;
    }
}
