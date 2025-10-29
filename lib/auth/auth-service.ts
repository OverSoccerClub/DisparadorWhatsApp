import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authConfig, validateAuthConfig } from './auth-config'

// Validar configuração
const configErrors = validateAuthConfig()
if (configErrors.length > 0) {
  console.error('❌ Erros de configuração de autenticação:', configErrors)
}

const supabase = createClient(authConfig.supabaseUrl, authConfig.supabaseKey)


export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  is_active: boolean
  is_admin: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
}

export class AuthService {
  private static readonly JWT_SECRET = authConfig.jwtSecret
  private static readonly JWT_EXPIRES_IN = authConfig.jwtExpiresIn

  // Gerar hash da senha
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
  }

  // Verificar senha
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Gerar token JWT
  static generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )
  }

  // Verificar token JWT
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET)
    } catch (error) {
      return null
    }
  }

  // Registrar novo usuário
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        return {
          success: false,
          message: 'Email já está em uso'
        }
      }

      // Hash da senha
      const passwordHash = await this.hashPassword(data.password)

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
        .single()

      if (error) {
        console.error('Erro ao criar usuário:', error)
        return {
          success: false,
          message: 'Erro ao criar usuário'
        }
      }

      // Gerar token
      const token = this.generateToken(user.id, user.email)

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
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      return {
        success: false,
        message: 'Erro interno do servidor'
      }
    }
  }

  // Fazer login
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Buscar usuário por email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single()

      if (error || !user) {
        return {
          success: false,
          message: 'Email ou senha incorretos'
        }
      }

      // Verificar se usuário está ativo
      if (!user.is_active) {
        return {
          success: false,
          message: 'Conta desativada'
        }
      }

      // Verificar senha
      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash)
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Email ou senha incorretos'
        }
      }

      // Atualizar último login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      // Gerar token
      const token = this.generateToken(user.id, user.email)

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
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return {
        success: false,
        message: 'Erro interno do servidor'
      }
    }
  }

  // Buscar usuário por ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return null
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
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
  }

  // Verificar se usuário está autenticado
  static async verifyAuth(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token)
      if (!decoded) {
        return null
      }

      return await this.getUserById(decoded.userId)
    } catch (error) {
      console.error('Erro na verificação de auth:', error)
      return null
    }
  }
}
