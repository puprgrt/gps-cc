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
    const { error: msgError } = await supabase
      .from('wa_messages')
      .insert({
        id: messageData.id,
        conversation_id: conversationId,
        sender_type: messageData.sender,
        text: messageData.text,
        status: 'sent',
        timestamp: new Date().toISOString()
      });

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

module.exports = {
  supabase,
  saveMessage,
  getActiveConversations
};
