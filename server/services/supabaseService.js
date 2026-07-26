require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[SupabaseService] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Gunakan Service Role Key agar Backend punya hak akses penuh (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function saveMessage(conversationId, messageData, contactData = null) {
  try {
    // 1. Simpan atau Update Kontak
    let contactId = null;
    if (contactData) {
      const { data: contact, error: contactError } = await supabase
        .from('wa_contacts')
        .upsert({ 
          phone_number: contactData.phoneNumber,
          name: contactData.name || contactData.phoneNumber,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'phone_number', returning: 'representation' })
        .select()
        .single();
      
      if (contactError) throw contactError;
      contactId = contact.id;
    }

    // 2. Simpan atau Update Percakapan (Sesi)
    const { data: conv, error: convError } = await supabase
      .from('wa_conversations')
      .upsert({
        id: conversationId,
        contact_id: contactId,
        last_message: messageData.text || '',
        status: messageData.sender === 'user' ? 'pending' : 'active',
        unread_count: messageData.sender === 'user' ? 1 : 0, // Akan diperbaiki jika perlu increment
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (convError) throw convError;

    // 3. Simpan Pesan Individu
    const payload = {
      id: messageData.id,
      conversation_id: conversationId,
      sender_type: messageData.sender,
      text: messageData.text,
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    if (messageData.metadata && (messageData.metadata.fileUrl || messageData.metadata.base64)) {
      payload.media_url = messageData.metadata.fileUrl || `data:${messageData.metadata.mimetype || 'application/octet-stream'};base64,${messageData.metadata.base64}`;
      payload.media_type = messageData.metadata.mimetype || messageData.type;
    } else if (messageData.type === 'image' || messageData.type === 'document' || messageData.type === 'video' || messageData.type === 'audio') {
      payload.media_type = messageData.metadata?.mimetype || messageData.type;
    }

    const { error: msgError } = await supabase
      .from('wa_messages')
      .insert(payload);

    if (msgError) throw msgError;

    return true;
  } catch (error) {
    console.error('[SupabaseService] Error saving message:', error);
    return false;
  }
}

async function getActiveConversations() {
  const { data, error } = await supabase
    .from('wa_conversations')
    .select(`
      *,
      contact:contact_id(*),
      messages:wa_messages(*)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[SupabaseService] Error fetching conversations:', error);
    return [];
  }
  return data;
}

async function upsertContacts(contactsArray) {
  if (!contactsArray || contactsArray.length === 0) return;
  try {
    const formatted = contactsArray.map(c => ({
      phone_number: c.id.split('@')[0],
      name: c.name,
      last_active_at: new Date().toISOString()
    }));
    // Bulk upsert to wa_contacts
    const { error } = await supabase
      .from('wa_contacts')
      .upsert(formatted, { onConflict: 'phone_number', ignoreDuplicates: false });
    
    if (error) console.error('[SupabaseService] Error syncing contacts:', error);
  } catch (err) {
    console.error('[SupabaseService] Error in upsertContacts:', err);
  }
}

async function getBotSettings() {
  try {
    const { data, error } = await supabase
      .from('wa_bot_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code === 'PGRST116') {
      // Row not found, create default
      const defaultSettings = {
        id: 'default',
        is_active: true,
        is_menu_active: true,
        is_keyword_active: true,
        model: 'gemini-3.6-flash',
        system_prompt: 'Anda adalah "PURI" (Pelayanan Umum & Informasi PUPR Garut), Asisten Virtual AI Resmi Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut.',
        min_text_length: 2
      };
      await supabase.from('wa_bot_settings').upsert(defaultSettings);
      return defaultSettings;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SupabaseService] Error getting bot settings:', err);
    return {
      is_active: true,
      is_menu_active: true,
      is_keyword_active: true,
      model: 'gemini-3.6-flash',
      system_prompt: 'Anda adalah "PURI" (Pelayanan Umum & Informasi PUPR Garut), Asisten Virtual AI Resmi Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut.',
      min_text_length: 2
    };
  }
}

async function updateBotSettings(settings) {
  try {
    const payload = {
      id: 'default',
      is_active: settings.is_active ?? true,
      model: settings.model || 'gemini-2.0-flash',
      system_prompt: settings.system_prompt,
      min_text_length: settings.min_text_length || 2,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('wa_bot_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SupabaseService] Error updating bot settings:', err);
    throw err;
  }
}

async function getBotMenuFlows() {
  try {
    const { data, error } = await supabase
      .from('wa_bot_menu_flows')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error && error.code === '42P01') {
      return [];
    }
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[SupabaseService] Error getting bot menu flows:', err);
    return [];
  }
}

async function getBotKeywords() {
  try {
    const { data, error } = await supabase
      .from('wa_bot_keywords')
      .select('*')
      .eq('is_active', true);

    if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
      return [];
    }
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[SupabaseService] Error getting bot keywords:', err);
    return [];
  }
}

module.exports = {
  supabase,
  saveMessage,
  getActiveConversations,
  upsertContacts,
  getBotSettings,
  updateBotSettings,
  getBotMenuFlows,
  getBotKeywords
};
