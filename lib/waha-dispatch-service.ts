import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface WahaCampaign {
  id: string
  user_id: string
  nome: string
  descricao?: string
  mensagem: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  delay_min: number
  delay_max: number
  messages_per_minute: number
  enable_variations: boolean
  variation_prompt?: string
  variation_count: number
  load_balancing_strategy: 'round_robin' | 'least_connections' | 'random'
  total_contacts: number
  sent_messages: number
  failed_messages: number
  pending_messages: number
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export interface WahaCampaignContact {
  id: string
  campaign_id: string
  phone_number: string
  nome?: string
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  error_message?: string
  sent_at?: string
  created_at: string
}

export interface WahaDispatch {
  id: string
  campaign_id: string
  user_id: string
  waha_server_id: string
  session_name: string
  mensagem: string
  variation_index: number
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'
  scheduled_at: string
  sent_at?: string
  response_time_ms?: number
  success?: boolean
  error_message?: string
  whatsapp_message_id?: string
  created_at: string
}

export interface WahaSessionStats {
  id: string
  waha_server_id: string
  session_name: string
  user_id: string
  total_sent: number
  total_failed: number
  active_connections: number
  last_activity: string
  created_at: string
  updated_at: string
}

export class WahaDispatchService {
  // Campanhas
  static async createCampaign(campaign: Omit<WahaCampaign, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('waha_campaigns')
      .insert(campaign)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getCampaigns(userId: string) {
    const { data, error } = await supabase
      .from('waha_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getCampaign(id: string, userId: string) {
    const { data, error } = await supabase
      .from('waha_campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  static async updateCampaign(id: string, updates: Partial<WahaCampaign>, userId: string) {
    const { data, error } = await supabase
      .from('waha_campaigns')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteCampaign(id: string, userId: string) {
    const { error } = await supabase
      .from('waha_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Contatos
  static async addContactsToCampaign(campaignId: string, contacts: Array<{ phone_number: string; nome?: string }>) {
    const contactsData = contacts.map(contact => ({
      campaign_id: campaignId,
      phone_number: contact.phone_number,
      nome: contact.nome
    }))

    const { data, error } = await supabase
      .from('waha_campaign_contacts')
      .insert(contactsData)
      .select()

    if (error) throw error
    return data
  }

  static async getCampaignContacts(campaignId: string, userId: string) {
    const { data, error } = await supabase
      .from('waha_campaign_contacts')
      .select(`
        *,
        waha_campaigns!inner(user_id)
      `)
      .eq('campaign_id', campaignId)
      .eq('waha_campaigns.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async updateContactStatus(contactId: string, status: WahaCampaignContact['status'], errorMessage?: string) {
    const updates: any = { status }
    if (status === 'sent') {
      updates.sent_at = new Date().toISOString()
    }
    if (errorMessage) {
      updates.error_message = errorMessage
    }

    const { data, error } = await supabase
      .from('waha_campaign_contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Disparos
  static async createDispatch(dispatch: Omit<WahaDispatch, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('waha_dispatches')
      .insert(dispatch)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getDispatches(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('waha_dispatches')
      .select(`
        *,
        waha_campaigns(nome),
        waha_servers(nome)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  static async updateDispatchStatus(dispatchId: string, status: WahaDispatch['status'], updates?: Partial<WahaDispatch>) {
    const updateData: any = { status }
    
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString()
    }
    
    if (updates) {
      Object.assign(updateData, updates)
    }

    const { data, error } = await supabase
      .from('waha_dispatches')
      .update(updateData)
      .eq('id', dispatchId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Estatísticas de sessões
  static async getSessionStats(userId: string) {
    const { data, error } = await supabase
      .from('waha_session_stats')
      .select(`
        *,
        waha_servers(nome)
      `)
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })

    if (error) throw error
    return data
  }

  static async updateSessionStats(wahaServerId: string, sessionName: string, userId: string, updates: Partial<WahaSessionStats>) {
    const { data, error } = await supabase
      .from('waha_session_stats')
      .upsert({
        waha_server_id: wahaServerId,
        session_name: sessionName,
        user_id: userId,
        ...updates,
        last_activity: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Estatísticas gerais
  static async getCampaignStats(campaignId: string, userId: string) {
    const { data, error } = await supabase
      .from('waha_campaign_contacts')
      .select(`
        status,
        waha_campaigns!inner(user_id)
      `)
      .eq('campaign_id', campaignId)
      .eq('waha_campaigns.user_id', userId)

    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      sent: data.filter(c => c.status === 'sent').length,
      failed: data.filter(c => c.status === 'failed').length,
      skipped: data.filter(c => c.status === 'skipped').length
    }

    return stats
  }
}
