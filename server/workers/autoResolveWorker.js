const { createClient } = require('@supabase/supabase-js');
const whatsappClient = require('../core/WhatsAppClient');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is missing. Auto-resolve worker may fail.');
}

// Gunakan Service Role Key jika ada, agar bisa bypass RLS jika diperlukan
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// 6 Jam dalam milidetik
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
// Interval pengecekan (30 Menit)
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Check for inactive conversations and resolve them automatically
 */
async function checkAndAutoResolve() {
  try {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - SIX_HOURS_MS).toISOString();

    // Fetch conversations that are active/pending/bot_handling and updated more than 6 hours ago
    const { data: conversations, error: fetchErr } = await supabase
      .from('wa_conversations')
      .select('id, contact_id, status, updated_at')
      .in('status', ['active', 'pending', 'bot_handling'])
      .lt('updated_at', sixHoursAgo);

    if (fetchErr) {
      console.error('[AutoResolveWorker] Error fetching conversations:', fetchErr.message);
      return;
    }

    if (!conversations || conversations.length === 0) {
      return;
    }

    console.log(`[AutoResolveWorker] Found ${conversations.length} conversation(s) inactive for 6 hours. Auto-resolving...`);

    const publicUrl = typeof process.env.NEXT_PUBLIC_APP_URL !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : 'https://gps-cc.garutkab.go.id';

    for (const conv of conversations) {
      // 1. Update status to resolved
      const { error: updateErr } = await supabase
        .from('wa_conversations')
        .update({ status: 'resolved', updated_at: now.toISOString() })
        .eq('id', conv.id);

      if (updateErr) {
        console.error(`[AutoResolveWorker] Error resolving conversation ${conv.id}:`, updateErr.message);
        continue;
      }

      // 2. Fetch contact info to send message
      const { data: contact, error: contactErr } = await supabase
        .from('wa_contacts')
        .select('phone_number')
        .eq('id', conv.contact_id)
        .single();

      if (contactErr || !contact) {
        console.error(`[AutoResolveWorker] Error fetching contact for conv ${conv.id}`);
        continue;
      }

      // 3. Send automated WhatsApp message with SKM link
      const surveyLink = `${publicUrl}/spms/survei?cid=${conv.id}`;
      const messageText = `Halo! Laporan/layanan Anda telah kami tutup secara otomatis karena tidak ada aktivitas selama 6 jam terakhir.\n\nSebagai upaya perbaikan layanan DPUPR Kabupaten Garut, mohon kesediaan Bapak/Ibu untuk mengisi Survei Kepuasan Masyarakat (SKM) melalui tautan berikut:\n\n${surveyLink}\n\nTerima kasih atas partisipasi Anda!`;

      // Try sending the message using WhatsAppClient (bot)
      try {
        const targetJid = contact.phone_number.includes('@s.whatsapp.net') 
          ? contact.phone_number 
          : `${contact.phone_number}@s.whatsapp.net`;
          
        await whatsappClient.sendMessage(targetJid, messageText);
        console.log(`[AutoResolveWorker] Sent auto-resolve SKM link to ${contact.phone_number}`);
      } catch (sendErr) {
        console.error(`[AutoResolveWorker] Failed sending message to ${contact.phone_number}:`, sendErr.message);
      }
    }
  } catch (error) {
    console.error('[AutoResolveWorker] Unexpected error:', error);
  }
}

/**
 * Start the worker loop
 */
function start() {
  console.log('[AutoResolveWorker] Started. Will check for inactive tickets every 30 minutes.');
  
  // Optional: Run once immediately upon start
  // checkAndAutoResolve();
  
  setInterval(() => {
    checkAndAutoResolve();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  start,
  checkAndAutoResolve
};
