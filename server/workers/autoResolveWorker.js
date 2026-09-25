const { supabase } = require('../services/supabaseService');
const whatsappClient = require('../core/WhatsAppClient');

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
      if (fetchErr.message?.includes('fetch failed') || fetchErr.code === '42P01') {
        console.warn(`[AutoResolveWorker] Gagal mengambil percakapan (${fetchErr.message}). Akan dicoba lagi nanti.`);
        return;
      }
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

      if (contactErr || !contact || !contact.phone_number) {
        console.error(`[AutoResolveWorker] Error fetching contact for conv ${conv.id}`);
        continue;
      }

      // 3. Send automated WhatsApp message with SKM link
      const surveyLink = process.env.SURVEY_URL || 'https://gps-cc.vercel.app/spms/survei';
      const messageText = `Halo! Laporan/layanan Anda telah kami tutup secara otomatis karena tidak ada aktivitas selama 6 jam terakhir.\n\nSebagai upaya perbaikan layanan DPUPR Kabupaten Garut, mohon kesediaan Bapak/Ibu untuk mengisi Survei Kepuasan Masyarakat (SKM) melalui tautan berikut:\n\n${surveyLink}\n\nTerima kasih atas partisipasi Anda!`;

      // Try sending the message using WhatsAppClient (bot)
      try {
        let cleanPhone = contact.phone_number.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1);
        }
        const targetJid = `${cleanPhone}@s.whatsapp.net`;
          
        await whatsappClient.sendMessage(targetJid, messageText);
        console.log(`[AutoResolveWorker] Sent auto-resolve SKM link to ${cleanPhone}`);
      } catch (sendErr) {
        console.error(`[AutoResolveWorker] Failed sending message to ${contact.phone_number}:`, sendErr.message);
      }
    }
  } catch (error) {
    console.error('[AutoResolveWorker] Unexpected error:', error.message || error);
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
