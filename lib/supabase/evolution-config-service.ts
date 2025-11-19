import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Usar chave anônima que está disponível no .env
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface EvolutionConfig {
  id?: string
  user_id: string
  api_url: string
  global_api_key: string
  webhook_url?: string
  created_at?: string
  updated_at?: string
}

export interface EvolutionInstance {
  id?: string
  user_id: string
  instance_name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error' // Coluna no banco é 'status', não 'connection_status'
  phone_number?: string
  profile_name?: string
  profile_picture_url?: string
  qr_code?: string
  last_connected_at?: string
  created_at?: string
  updated_at?: string
}

export class EvolutionConfigService {
  // Salvar configuração da Evolution API
  static async saveConfig(config: Omit<EvolutionConfig, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('evolution_configs')
        .upsert({
          user_id: config.user_id,
          api_url: config.api_url,
          global_api_key: config.global_api_key,
          webhook_url: config.webhook_url
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar configuração:', error)
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro no EvolutionConfigService.saveConfig:', error)
      return { success: false, error: (error as any)?.message || String(error) }
    }
  }

  // Buscar configuração do usuário
  static async getConfig(userId: string) {
    try {
      console.log(`🔍 [EvolutionConfigService] Buscando configuração para usuário: ${userId}`)
      
      const { data, error } = await supabase
        .from('evolution_configs')
        .select('*')
        .eq('user_id', userId)
        .single()

      console.log(`📊 [EvolutionConfigService] Resultado da consulta:`, { data, error })

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ [EvolutionConfigService] Erro ao buscar configuração:', error)
        throw error
      }

      if (!data) {
        console.log(`⚠️ [EvolutionConfigService] Nenhuma configuração encontrada para usuário: ${userId}`)
        return { success: false, error: 'Configuração não encontrada' }
      }

      console.log(`✅ [EvolutionConfigService] Configuração encontrada:`, data)
      return { success: true, data: data || null }
    } catch (error) {
      console.error('❌ [EvolutionConfigService] Erro no EvolutionConfigService.getConfig:', error)
      return { success: false, error: (error as any)?.message || String(error) }
    }
  }

  // Salvar instância criada (usa upsert para evitar duplicatas)
  static async saveInstance(instance: Omit<EvolutionInstance, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('💾 [EvolutionConfigService] Salvando instância:', {
        user_id: instance.user_id,
        instance_name: instance.instance_name,
        status: instance.status
      })

      // Usar upsert para evitar duplicatas (baseado no índice único user_id + instance_name)
      // IMPORTANTE: A coluna no banco é 'status', não 'connection_status'
      const { data, error } = await supabase
        .from('evolution_instances')
        .upsert({
          user_id: instance.user_id,
          instance_name: instance.instance_name,
          status: instance.status || 'disconnected', // Coluna correta: 'status'
          phone_number: instance.phone_number,
          profile_name: instance.profile_name,
          profile_picture_url: instance.profile_picture_url,
          qr_code: instance.qr_code,
          last_connected_at: instance.last_connected_at
        }, {
          onConflict: 'user_id,instance_name',
          ignoreDuplicates: false // Atualizar se já existir
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [EvolutionConfigService] Erro ao salvar instância:', error)
        throw error
      }

      console.log('✅ [EvolutionConfigService] Instância salva com sucesso:', data)
      return { success: true, data }
    } catch (error: any) {
      console.error('❌ [EvolutionConfigService] Erro no saveInstance:', error)
      return { success: false, error: (error as any)?.message || 'Erro desconhecido ao salvar instância' }
    }
  }

  // Buscar instâncias do usuário
  static async getUserInstances(userId: string) {
    try {
      console.log('🔍 [EvolutionConfigService] Buscando instâncias para usuário:', userId)
      
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [EvolutionConfigService] Erro ao buscar instâncias:', error)
        throw error
      }

      console.log(`✅ [EvolutionConfigService] Encontradas ${data?.length || 0} instâncias para usuário ${userId}`)
      if (data && data.length > 0) {
        console.log('📋 [EvolutionConfigService] Instâncias encontradas:', data.map(i => i.instance_name))
      }

      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('❌ [EvolutionConfigService] Erro no getUserInstances:', error)
      return { success: false, error: (error as any)?.message || 'Erro desconhecido ao buscar instâncias' }
    }
  }

  // Atualizar status da instância
  static async updateInstanceStatus(
    userId: string, 
    instanceName: string, 
    updates: Partial<Pick<EvolutionInstance, 'status' | 'phone_number' | 'profile_name' | 'profile_picture_url' | 'qr_code' | 'last_connected_at'>>
  ) {
    try {
      console.log('🔄 [EvolutionConfigService] Atualizando instância:', { userId, instanceName, updates })
      
      const { data, error } = await supabase
        .from('evolution_instances')
        .update(updates)
        .eq('user_id', userId)
        .eq('instance_name', instanceName)
        .select()
        .single()

      if (error) {
        console.error('❌ [EvolutionConfigService] Erro ao atualizar instância:', error)
        throw error
      }

      console.log('✅ [EvolutionConfigService] Instância atualizada:', data)
      return { success: true, data }
    } catch (error: any) {
      console.error('❌ [EvolutionConfigService] Erro no updateInstanceStatus:', error)
      return { success: false, error: (error as any)?.message || 'Erro desconhecido ao atualizar instância' }
    }
  }

  // Excluir instância
  static async deleteInstance(userId: string, instanceName: string) {
    try {
      const { data, error } = await supabase
        .from('evolution_instances')
        .delete()
        .eq('user_id', userId)
        .eq('instance_name', instanceName)
        .select()
        .single()

      if (error) {
        console.error('Erro ao excluir instância:', error)
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro no EvolutionConfigService.deleteInstance:', error)
      return { success: false, error: (error as any)?.message || String(error) }
    }
  }

  // Buscar instância específica
  static async getInstance(userId: string, instanceName: string) {
    try {
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('instance_name', instanceName)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar instância:', error)
        throw error
      }

      return { success: true, data: data || null }
    } catch (error) {
      console.error('Erro no EvolutionConfigService.getInstance:', error)
      return { success: false, error: (error as any)?.message || String(error) }
    }
  }
}
