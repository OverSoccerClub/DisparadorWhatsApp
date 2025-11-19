"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WahaDispatchService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
class WahaDispatchService {
    // Campanhas
    static async createCampaign(campaign) {
        const { data, error } = await supabase
            .from('waha_campaigns')
            .insert(campaign)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async getCampaigns(userId) {
        const { data, error } = await supabase
            .from('waha_campaigns')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    static async getCampaign(id, userId) {
        const { data, error } = await supabase
            .from('waha_campaigns')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error)
            throw error;
        return data;
    }
    static async updateCampaign(id, updates, userId) {
        const { data, error } = await supabase
            .from('waha_campaigns')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async deleteCampaign(id, userId) {
        const { error } = await supabase
            .from('waha_campaigns')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
    }
    // Contatos
    static async addContactsToCampaign(campaignId, contacts) {
        const contactsData = contacts.map(contact => ({
            campaign_id: campaignId,
            phone_number: contact.phone_number,
            nome: contact.nome
        }));
        const { data, error } = await supabase
            .from('waha_campaign_contacts')
            .insert(contactsData)
            .select();
        if (error)
            throw error;
        return data;
    }
    static async getCampaignContacts(campaignId, userId) {
        const { data, error } = await supabase
            .from('waha_campaign_contacts')
            .select(`
        *,
        waha_campaigns!inner(user_id)
      `)
            .eq('campaign_id', campaignId)
            .eq('waha_campaigns.user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    static async updateContactStatus(contactId, status, errorMessage) {
        const updates = { status };
        if (status === 'sent') {
            updates.sent_at = new Date().toISOString();
        }
        if (errorMessage) {
            updates.error_message = errorMessage;
        }
        const { data, error } = await supabase
            .from('waha_campaign_contacts')
            .update(updates)
            .eq('id', contactId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Disparos
    static async createDispatch(dispatch) {
        const { data, error } = await supabase
            .from('waha_dispatches')
            .insert(dispatch)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async getDispatches(userId, limit = 100) {
        const { data, error } = await supabase
            .from('waha_dispatches')
            .select(`
        *,
        waha_campaigns(nome),
        waha_servers(nome)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data;
    }
    static async updateDispatchStatus(dispatchId, status, updates) {
        const updateData = { status };
        if (status === 'sent') {
            updateData.sent_at = new Date().toISOString();
        }
        if (updates) {
            Object.assign(updateData, updates);
        }
        const { data, error } = await supabase
            .from('waha_dispatches')
            .update(updateData)
            .eq('id', dispatchId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Estatísticas de sessões
    static async getSessionStats(userId) {
        const { data, error } = await supabase
            .from('waha_session_stats')
            .select(`
        *,
        waha_servers(nome)
      `)
            .eq('user_id', userId)
            .order('last_activity', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    static async updateSessionStats(wahaServerId, sessionName, userId, updates) {
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
            .single();
        if (error)
            throw error;
        return data;
    }
    // Estatísticas gerais
    static async getCampaignStats(campaignId, userId) {
        const { data, error } = await supabase
            .from('waha_campaign_contacts')
            .select(`
        status,
        waha_campaigns!inner(user_id)
      `)
            .eq('campaign_id', campaignId)
            .eq('waha_campaigns.user_id', userId);
        if (error)
            throw error;
        const stats = {
            total: data.length,
            pending: data.filter(c => c.status === 'pending').length,
            sent: data.filter(c => c.status === 'sent').length,
            failed: data.filter(c => c.status === 'failed').length,
            skipped: data.filter(c => c.status === 'skipped').length
        };
        return stats;
    }
}
exports.WahaDispatchService = WahaDispatchService;
