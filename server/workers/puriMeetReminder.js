const { createClient } = require('@supabase/supabase-js');
const whatsappClient = require('../core/WhatsAppClient');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check for meetings starting in exactly 30 minutes
 * and send WhatsApp reminders to participants.
 */
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const thirtyFiveMinLater = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

    // 1. Fetch meetings scheduled between 30-35 mins from now
    const { data: meetings, error: meetingErr } = await supabase
      .from('meetings')
      .select('id, title, scheduled_at, room_id, bidang, reminder_sent')
      .eq('status', 'SCHEDULED')
      .eq('reminder_sent', false)
      .gte('scheduled_at', thirtyMinLater)
      .lt('scheduled_at', thirtyFiveMinLater);

    if (meetingErr) {
      console.error('[PuriMeetReminder] Error fetching meetings:', meetingErr.message);
      return;
    }

    if (!meetings || meetings.length === 0) {
      return;
    }

    console.log(`[PuriMeetReminder] Found ${meetings.length} meeting(s) requiring reminders.`);

    // 2. For each meeting, fetch participants with phone numbers and send messages
    for (const meeting of meetings) {
      const { data: participants, error: partErr } = await supabase
        .from('meeting_participants')
        .select('user_name, user_phone')
        .eq('meeting_id', meeting.id)
        .not('user_phone', 'is', null);

      if (partErr || !participants || participants.length === 0) {
        // No participants to remind, just mark as sent
        await supabase.from('meetings').update({ reminder_sent: true }).eq('id', meeting.id);
        continue;
      }

      // Format time nicely
      const scheduledDate = new Date(meeting.scheduled_at);
      const timeStr = scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const dateStr = scheduledDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
      
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const meetingLink = `${dashboardUrl}/puri-meet/room/${meeting.room_id}`;

      let successCount = 0;

      for (const p of participants) {
        if (!p.user_phone) continue;

        // Clean phone number
        let phone = p.user_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
        }

        const messageText = `*PURI MEET REMINDER* 📹\n\n` +
          `Halo ${p.user_name},\n\n` +
          `Mengingatkan bahwa Anda memiliki jadwal meeting video conference di PURI Meet:\n\n` +
          `*Judul*: ${meeting.title}\n` +
          `*Bidang*: ${meeting.bidang}\n` +
          `*Waktu*: ${dateStr} pukul ${timeStr} WIB\n\n` +
          `Silakan klik tautan berikut untuk bergabung ke ruangan:\n` +
          `${meetingLink}\n\n` +
          `_Pesan ini dikirim otomatis oleh GPS-CC._`;

        try {
          const sentId = await whatsappClient.sendTextMessage(phone, messageText);
          if (sentId) successCount++;
        } catch (sendErr) {
          console.error(`[PuriMeetReminder] Failed to send to ${phone}:`, sendErr.message);
        }
      }

      console.log(`[PuriMeetReminder] Sent ${successCount}/${participants.length} reminders for meeting ${meeting.id}.`);

      // 3. Mark meeting as reminder sent
      await supabase.from('meetings').update({ reminder_sent: true }).eq('id', meeting.id);
    }
  } catch (err) {
    console.error('[PuriMeetReminder] Exception during check:', err);
  }
}

let reminderInterval = null;

function start() {
  if (reminderInterval) return;
  console.log('[PuriMeetReminder] Service started. Checking every 1 minute.');
  // Check every 1 minute
  reminderInterval = setInterval(checkAndSendReminders, 60000);
}

function stop() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[PuriMeetReminder] Service stopped.');
  }
}

module.exports = {
  start,
  stop,
  checkAndSendReminders
};
