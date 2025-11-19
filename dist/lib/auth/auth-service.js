"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_config_1 = require("./auth-config");
// Validar configuração
const configErrors = (0, auth_config_1.validateAuthConfig)();
if (configErrors.length > 0) {
    console.error('❌ Erros de configuração de autenticação:', configErrors);
}
const supabase = (0, supabase_js_1.createClient)(auth_config_1.authConfig.supabaseUrl, auth_config_1.authConfig.supabaseKey);
class AuthService {
    // Gerar hash da senha
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcryptjs_1.default.hash(password, saltRounds);
    }
    // Verificar senha
    static async verifyPassword(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
    // Gerar token JWT
    static generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    // Verificar token JWT
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    // Registrar novo usuário
    static async register(data) {
        try {
            // Verificar se email já existe
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('email', data.email)
                .single();
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email já está em uso'
                };
            }
            // Hash da senha
            const passwordHash = await this.hashPassword(data.password);
            // Criar usuário
            const { data: user, error } = await supabase
                .from('users')
                .insert({
                email: data.email,
                password_hash: passwordHash,
                name: data.name,
                is_active: true,
                is_admin: false
            })
                .select()
                .single();
            if (error) {
                console.error('Erro ao criar usuário:', error);
                return {
                    success: false,
                    message: 'Erro ao criar usuário'
                };
            }
            // Gerar token
            const token = this.generateToken(user.id, user.email);
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url,
                    is_active: user.is_active,
                    is_admin: user.is_admin,
                    last_login: user.last_login,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                },
                token
            };
        }
        catch (error) {
            console.error('Erro no registro:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }
    // Fazer login
    static async login(credentials) {
        try {
            // Buscar usuário por email
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', credentials.email)
                .single();
            if (error || !user) {
                return {
                    success: false,
                    message: 'Email ou senha incorretos'
                };
            }
            // Verificar se usuário está ativo
            if (!user.is_active) {
                return {
                    success: false,
                    message: 'Conta desativada'
                };
            }
            // Verificar senha
            const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email ou senha incorretos'
                };
            }
            // Atualizar último login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
            // Gerar token
            const token = this.generateToken(user.id, user.email);
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url,
                    is_active: user.is_active,
                    is_admin: user.is_admin,
                    last_login: user.last_login,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                },
                token
            };
        }
        catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }
    // Buscar usuário por ID
    static async getUserById(userId) {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error || !user) {
                return null;
            }
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                is_active: user.is_active,
                is_admin: user.is_admin,
                last_login: user.last_login,
                created_at: user.created_at,
                updated_at: user.updated_at
            };
        }
        catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }
    }
    // Verificar se usuário está autenticado
    static async verifyAuth(token) {
        try {
            const decoded = this.verifyToken(token);
            if (!decoded) {
                return null;
            }
            return await this.getUserById(decoded.userId);
        }
        catch (error) {
            console.error('Erro na verificação de auth:', error);
            return null;
        }
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = auth_config_1.authConfig.jwtSecret;
AuthService.JWT_EXPIRES_IN = auth_config_1.authConfig.jwtExpiresIn;
