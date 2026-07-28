require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const WHATSAPP_MEDIA_BUCKET = 'whatsapp-media';
const MAX_WHATSAPP_MEDIA_BYTES = 20 * 1024 * 1024;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[SupabaseService] WARNING: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Using fallback placeholder.');
}

// Gunakan Service Role Key agar Backend punya hak akses penuh (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function safePathSegment(value, fallback) {
  const normalized = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  return normalized || fallback;
}

function extensionForMedia(mimetype, type) {
  const mime = String(mimetype || '').toLowerCase();
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'application/pdf') return 'pdf';
  return type === 'image' ? 'jpg' : 'pdf';
}

async function uploadWhatsAppMedia({ buffer, conversationId, messageId, mimetype, type }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Lampiran WhatsApp kosong atau tidak valid.');
  }
  if (buffer.length > MAX_WHATSAPP_MEDIA_BYTES) {
    throw new Error(`Lampiran WhatsApp melebihi batas ${MAX_WHATSAPP_MEDIA_BYTES / (1024 * 1024)} MB.`);
  }

  const contentType = String(mimetype || '').toLowerCase();
  const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);
  if (!allowedMimeTypes.has(contentType)) {
    throw new Error(`Tipe lampiran WhatsApp tidak diizinkan: ${contentType || 'unknown'}.`);
  }

  const now = new Date();
  const storagePath = [
    'inbound',
    now.toISOString().slice(0, 7),
    safePathSegment(conversationId, 'conversation'),
    `${safePathSegment(messageId, String(now.getTime()))}.${extensionForMedia(contentType, type)}`,
  ].join('/');

  const { error } = await supabase.storage.from(WHATSAPP_MEDIA_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '0',
    upsert: false,
  });
  if (error) throw error;

  return { storagePath, bucket: WHATSAPP_MEDIA_BUCKET };
}

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

    if (messageData.metadata && (messageData.metadata.storagePath || messageData.metadata.fileUrl)) {
      // Simpan path Storage privat, bukan data URL atau URL publik.
      payload.media_url = messageData.metadata.storagePath || messageData.metadata.fileUrl;
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

async function updateConversationStatus(conversationId, status, metadata = {}) {
  try {
    const payload = {
      status,
      updated_at: new Date().toISOString(),
      ...metadata,
    };
    const { error } = await supabase
      .from('wa_conversations')
      .update(payload)
      .eq('id', conversationId);

    if (error) {
      console.warn('[SupabaseService] Error updating conversation status:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] Exception in updateConversationStatus:', err.message || err);
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

// ============================================================================
// PURI RAG KNOWLEDGE BASE & FAQ CACHE (SUPABASE DEFAULT DB)
// ============================================================================
async function saveRAGDocument(docData) {
  try {
    const docId = docData.id || `doc-${Date.now()}`;
    const payload = {
      id: docId,
      bidang: docData.bidang,
      title: docData.title,
      keywords: docData.keywords || [],
      content: docData.content,
      updated_at: docData.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('puri_rag_knowledge_base')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.code === '42P01') {
        console.warn('[SupabaseService] Table puri_rag_knowledge_base does not exist yet. Storing in local disk DB.');
        return false;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseService] Fallback saving RAG document:', err.message || err);
    return false;
  }
}

async function getAllRAGDocuments() {
  try {
    const { data, error } = await supabase
      .from('puri_rag_knowledge_base')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
      return [];
    }
    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      bidang: item.bidang,
      title: item.title,
      keywords: item.keywords || [],
      content: item.content,
      updatedAt: item.updated_at || item.updatedAt,
    }));
  } catch (err) {
    console.warn('[SupabaseService] Error fetching RAG docs from Supabase:', err.message || err);
    return [];
  }
}

async function saveFAQEntry(entryData) {
  try {
    const qKey = entryData.queryKey || entryData.key || `faq-${Date.now()}`;
    const payload = {
      query_key: qKey,
      reply_text: entryData.replyText,
      category: entryData.category || 'CHAT_GENERAL',
      hit_count: entryData.hitCount || 1,
      updated_at: entryData.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('puri_faq_cache')
      .upsert(payload, { onConflict: 'query_key' });

    if (error) {
      if (error.code === '42P01') {
        return false;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.warn('[SupabaseService] Fallback saving FAQ entry:', err.message || err);
    return false;
  }
}

async function getAllFAQEntries() {
  try {
    const { data, error } = await supabase
      .from('puri_faq_cache')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
      return [];
    }
    if (error) throw error;

    return (data || []).map((item) => ({
      queryKey: item.query_key || item.queryKey,
      replyText: item.reply_text || item.replyText,
      category: item.category || 'CHAT_GENERAL',
      hitCount: item.hit_count || item.hitCount || 1,
      updatedAt: item.updated_at || item.updatedAt,
    }));
  } catch (err) {
    console.warn('[SupabaseService] Error fetching FAQ entries from Supabase:', err.message || err);
    return [];
  }
}

// ============================================================================
// SPMS (Smart Public Service Performance Management System)
// ============================================================================
async function saveSurveyResponse(responseData) {
  try {
    const payload = {
      respondent_name: responseData.name,
      respondent_phone: responseData.phoneNumber,
      layanan: responseData.layanan || 'PENGADUAN',
      channel: responseData.channel || 'WHATSAPP',
      status: 'COMPLETED',
      dimensions: responseData.dimensions || {},
      nps_score: responseData.npsScore || 0,
      comment: responseData.comment || '',
      sentimen: responseData.sentimen || 'NETRAL',
      ticket_id: responseData.ticketId,
      submitted_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('spms_survey_responses')
      .insert(payload);

    if (error) {
      if (error.code === '42P01') {
        console.warn('[SupabaseService] Table spms_survey_responses does not exist yet.');
        return false;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] Error saving survey response:', err.message || err);
    return false;
  }
}

// ============================================================================
// CONVERSATION HISTORY (MEMORY)
// ============================================================================
async function getConversationHistory(conversationId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('wa_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[SupabaseService] Error fetching conversation history:', error.message);
      return [];
    }

    // Return in chronological order for prompt injection
    return (data || []).reverse();
  } catch (err) {
    console.error('[SupabaseService] Exception in getConversationHistory:', err.message || err);
    return [];
  }
}

// ============================================================================
// SPREADSHEET INTEGRATION
// ============================================================================
async function getSpreadsheetConfigs() {
  try {
    const { data, error } = await supabase
      .from('puri_spreadsheets')
      .select('*')
      .order('layanan_name', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        console.warn('[SupabaseService] Table puri_spreadsheets does not exist yet.');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('[SupabaseService] Error getting spreadsheet configs:', err.message || err);
    return [];
  }
}

async function saveSpreadsheetConfig(config) {
  try {
    const payload = {
      layanan_name: config.layanan_name,
      bidang: config.bidang || 'SEKRETARIAT',
      spreadsheet_id: config.spreadsheet_id,
      sheet_name: config.sheet_name || 'Sheet1',
      description: config.description || '',
      column_mapping: config.column_mapping || {},
      is_active: config.is_active !== undefined ? config.is_active : true,
      cache_ttl_minutes: config.cache_ttl_minutes || 15,
      updated_at: new Date().toISOString()
    };

    if (config.id) {
      payload.id = config.id;
    }

    const { data, error } = await supabase
      .from('puri_spreadsheets')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SupabaseService] Error saving spreadsheet config:', err.message || err);
    throw err;
  }
}

async function deleteSpreadsheetConfig(id) {
  try {
    const { error } = await supabase
      .from('puri_spreadsheets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[SupabaseService] Error deleting spreadsheet config:', err.message || err);
    throw err;
  }
}

module.exports = {
  supabase,
  WHATSAPP_MEDIA_BUCKET,
  uploadWhatsAppMedia,
  saveMessage,
  updateConversationStatus,
  getActiveConversations,
  upsertContacts,
  getBotSettings,
  updateBotSettings,
  getBotMenuFlows,
  getBotKeywords,
  saveRAGDocument,
  getAllRAGDocuments,
  saveFAQEntry,
  getAllFAQEntries,
  saveSurveyResponse,
  getConversationHistory,
  getSpreadsheetConfigs,
  saveSpreadsheetConfig,
  deleteSpreadsheetConfig,
};
