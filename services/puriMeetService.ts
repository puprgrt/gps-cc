import { supabase } from '@/lib/supabase';
import type {
  Meeting,
  MeetingParticipant,
  MeetingStats,
  CreateMeetingInput,
  UpdateMeetingInput,
  MeetingFilter,
  MeetingReminder,
} from '@/domain/puriMeet';

// ============================================================
// Helper: Generate unique room ID
// ============================================================
function generateRoomId(bidang: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = bidang.toLowerCase().replace(/_/g, '-');
  return `puri-meet-${prefix}-${timestamp}-${random}`;
}

// Helper: Generate deterministic or random numeric 6-digit passcode
function generatePasscode(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash % 900000) + 100000;
  return code.toString();
}

// Helper: Format Meeting ID into Zoom-like numeric format (e.g. 849 203 1192)
function formatMeetingIdDisplay(roomId: string): string {
  let hash = 5381;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash * 33) ^ roomId.charCodeAt(i);
  }
  const positive = Math.abs(hash).toString().padStart(10, '7');
  const part1 = positive.substring(0, 3);
  const part2 = positive.substring(3, 6);
  const part3 = positive.substring(6, 10);
  return `${part1} ${part2} ${part3}`;
}

// ============================================================
// Helper: Map DB row to Meeting interface
// ============================================================
function mapRowToMeeting(row: Record<string, unknown>): Meeting {
  const roomId = row.room_id as string;
  const id = row.id as string;
  return {
    id,
    title: row.title as string,
    type: row.type as Meeting['type'],
    status: row.status as Meeting['status'],
    priority: row.priority as Meeting['priority'],
    roomId,
    description: (row.description as string) || '',
    scheduledAt: row.scheduled_at as string,
    startedAt: (row.started_at as string) || null,
    endedAt: (row.ended_at as string) || null,
    durationMinutes: row.duration_minutes as number,
    bidang: row.bidang as Meeting['bidang'],
    createdBy: row.created_by as string,
    createdByName: (row.created_by_name as string) || '',
    maxParticipants: row.max_participants as number,
    participantCount: row.participant_count as number,
    passcode: (row.passcode as string) || generatePasscode(id || roomId),
    meetingIdDisplay: (row.meeting_id_display as string) || formatMeetingIdDisplay(roomId),
    agenda: (row.agenda as string[]) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================
// Service Class
// ============================================================
export class PuriMeetService {
  // ----------------------------------------------------------
  // Fetch meetings with filters
  // ----------------------------------------------------------
  static async fetchMeetings(filter?: Partial<MeetingFilter>): Promise<Meeting[]> {
    try {
      let query = supabase
        .from('meetings')
        .select('*')
        .order('scheduled_at', { ascending: true })
        .limit(100);

      if (filter?.status && filter.status !== 'ALL') {
        query = query.eq('status', filter.status);
      }
      if (filter?.type && filter.type !== 'ALL') {
        query = query.eq('type', filter.type);
      }
      if (filter?.bidang && filter.bidang !== 'ALL') {
        query = query.eq('bidang', filter.bidang);
      }
      if (filter?.dateFrom) {
        query = query.gte('scheduled_at', filter.dateFrom);
      }
      if (filter?.dateTo) {
        query = query.lte('scheduled_at', filter.dateTo);
      }
      if (filter?.search) {
        query = query.ilike('title', `%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[PuriMeet] fetchMeetings error:', error.message);
        return [];
      }

      return (data || []).map(mapRowToMeeting);
    } catch (err) {
      console.error('[PuriMeet] fetchMeetings exception:', err);
      return [];
    }
  }

  // ----------------------------------------------------------
  // Fetch single meeting
  // ----------------------------------------------------------
  static async fetchMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error || !data) return null;
      return mapRowToMeeting(data);
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------
  // Fetch meeting by room ID
  // ----------------------------------------------------------
  static async fetchMeetingByRoomId(roomId: string): Promise<Meeting | null> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error || !data) return null;
      return mapRowToMeeting(data);
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------
  // Create meeting
  // ----------------------------------------------------------
  static async createMeeting(input: CreateMeetingInput, userId: string, userName: string): Promise<Meeting | null> {
    try {
      const roomId = generateRoomId(input.bidang);

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          title: input.title,
          type: input.type,
          priority: input.priority,
          room_id: roomId,
          description: input.description,
          scheduled_at: input.scheduledAt,
          duration_minutes: input.durationMinutes,
          bidang: input.bidang,
          created_by: userId,
          created_by_name: userName,
          max_participants: input.maxParticipants,
          participant_count: input.participants.length,
          agenda: input.agenda,
        })
        .select()
        .single();

      if (error || !data) {
        console.error('[PuriMeet] createMeeting error:', error?.message);
        return null;
      }

      // Insert participants
      if (input.participants.length > 0) {
        const participants = input.participants.map((p) => ({
          meeting_id: data.id,
          user_name: p.userName,
          user_email: p.userEmail,
          user_phone: p.userPhone,
          role: p.role,
        }));

        await supabase.from('meeting_participants').insert(participants);
      }

      return mapRowToMeeting(data);
    } catch (err) {
      console.error('[PuriMeet] createMeeting exception:', err);
      return null;
    }
  }

  // ----------------------------------------------------------
  // Update meeting
  // ----------------------------------------------------------
  static async updateMeeting(meetingId: string, input: UpdateMeetingInput): Promise<Meeting | null> {
    try {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.scheduledAt !== undefined) updateData.scheduled_at = input.scheduledAt;
      if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes;
      if (input.maxParticipants !== undefined) updateData.max_participants = input.maxParticipants;
      if (input.agenda !== undefined) updateData.agenda = input.agenda;

      const { data, error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId)
        .select()
        .single();

      if (error || !data) return null;
      return mapRowToMeeting(data);
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------
  // Start meeting (set status to LIVE)
  // ----------------------------------------------------------
  static async startMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          status: 'LIVE',
          started_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error || !data) return null;
      return mapRowToMeeting(data);
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------
  // End meeting (set status to COMPLETED)
  // ----------------------------------------------------------
  static async endMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          status: 'COMPLETED',
          ended_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error || !data) return null;
      return mapRowToMeeting(data);
    } catch {
      return null;
    }
  }

  // ----------------------------------------------------------
  // Cancel meeting
  // ----------------------------------------------------------
  static async cancelMeeting(meetingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'CANCELLED' })
        .eq('id', meetingId);

      return !error;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------
  // Fetch participants for a meeting
  // ----------------------------------------------------------
  static async fetchParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id as string,
        meetingId: row.meeting_id as string,
        userName: row.user_name as string,
        userEmail: (row.user_email as string) || '',
        userPhone: (row.user_phone as string) || null,
        role: row.role as MeetingParticipant['role'],
        joinedAt: (row.joined_at as string) || null,
        leftAt: (row.left_at as string) || null,
      }));
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------------
  // Add participant to a meeting
  // ----------------------------------------------------------
  static async addParticipant(
    meetingId: string,
    userName: string,
    userEmail: string,
    role: MeetingParticipant['role'] = 'PARTICIPANT'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: meetingId,
          user_name: userName,
          user_email: userEmail,
          role,
          joined_at: new Date().toISOString(),
        });

      if (!error) {
        // Update participant count
        await supabase.rpc('increment_participant_count', { meeting_id_input: meetingId });
      }

      return !error;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------
  // Fetch meeting stats (dashboard)
  // ----------------------------------------------------------
  static async fetchMeetingStats(): Promise<MeetingStats> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      // Get start of week (Monday)
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday).toISOString();
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - diffToMonday)).toISOString();

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // Parallel queries
      const [todayRes, weekRes, monthRes, activeRes, avgRes] = await Promise.all([
        supabase.from('meetings').select('id', { count: 'exact', head: true })
          .gte('scheduled_at', todayStart).lt('scheduled_at', todayEnd),
        supabase.from('meetings').select('id', { count: 'exact', head: true })
          .gte('scheduled_at', weekStart).lt('scheduled_at', weekEnd),
        supabase.from('meetings').select('id, participant_count', { count: 'exact' })
          .gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd),
        supabase.from('meetings').select('id', { count: 'exact', head: true })
          .eq('status', 'LIVE'),
        supabase.from('meetings').select('duration_minutes')
          .eq('status', 'COMPLETED')
          .gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd)
          .limit(100),
      ]);

      const totalPeserta = (monthRes.data || []).reduce(
        (sum, m) => sum + ((m as Record<string, unknown>).participant_count as number || 0), 0
      );

      const avgDurations = avgRes.data || [];
      const durasiRataRata = avgDurations.length > 0
        ? Math.round(avgDurations.reduce((sum, d) => sum + ((d as Record<string, unknown>).duration_minutes as number || 0), 0) / avgDurations.length)
        : 0;

      return {
        meetingHariIni: todayRes.count || 0,
        meetingMingguIni: weekRes.count || 0,
        durasiRataRata,
        totalPesertaBulanIni: totalPeserta,
        meetingAktif: activeRes.count || 0,
        totalMeetingBulanIni: monthRes.count || 0,
      };
    } catch {
      return {
        meetingHariIni: 0,
        meetingMingguIni: 0,
        durasiRataRata: 0,
        totalPesertaBulanIni: 0,
        meetingAktif: 0,
        totalMeetingBulanIni: 0,
      };
    }
  }

  // ----------------------------------------------------------
  // Get meetings needing reminder (30 min before)
  // ----------------------------------------------------------
  static async getMeetingsNeedingReminder(): Promise<MeetingReminder[]> {
    try {
      const now = new Date();
      const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      const thirtyFiveMinLater = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('meetings')
        .select('id, title, scheduled_at, room_id, reminder_sent')
        .eq('status', 'SCHEDULED')
        .eq('reminder_sent', false)
        .gte('scheduled_at', thirtyMinLater)
        .lt('scheduled_at', thirtyFiveMinLater);

      if (error || !data || data.length === 0) return [];

      const reminders: MeetingReminder[] = [];

      for (const meeting of data) {
        const meetingRow = meeting as Record<string, unknown>;
        const participants = await this.fetchParticipants(meetingRow.id as string);
        const phoneParts = participants
          .filter((p) => p.userPhone)
          .map((p) => ({ name: p.userName, phone: p.userPhone as string }));

        reminders.push({
          meetingId: meetingRow.id as string,
          meetingTitle: meetingRow.title as string,
          scheduledAt: meetingRow.scheduled_at as string,
          roomId: meetingRow.room_id as string,
          participants: phoneParts,
          reminderSentAt: null,
          isReminderSent: false,
        });
      }

      return reminders;
    } catch {
      return [];
    }
  }

  // ----------------------------------------------------------
  // Mark reminder as sent
  // ----------------------------------------------------------
  static async markReminderSent(meetingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ reminder_sent: true })
        .eq('id', meetingId);

      return !error;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------
  // Get Jitsi IFrame config
  // ----------------------------------------------------------
  static getJitsiConfig(
    roomName: string,
    displayName: string,
    email: string,
    subject: string
  ): {
    domain: string;
    roomName: string;
    displayName: string;
    email: string;
    subject: string;
    configOverwrite: Record<string, unknown>;
    interfaceConfigOverwrite: Record<string, unknown>;
  } {
    return {
      domain: 'meet.jit.si',
      roomName,
      displayName,
      email,
      subject,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        prejoinConfig: {
          enabled: false,
        },
        skipPrejoinOnReload: true,
        enableWelcomePage: false,
        enableClosePage: false,
        disableInviteFunctions: false,
        enableLobbyChat: true,
        // Jitsi Security & Zoom-like Features
        toolbarButtons: [
          'camera', 'chat', 'closedcaptions', 'desktop', 'embedmeeting',
          'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
          'recording', 'livestreaming', 'etherpad', 'sharedvideo', 
          'settings', 'raisehand', 'videoquality', 'filmstrip', 
          'participants-pane', 'tileview', 'select-background', 
          'download', 'help', 'mute-everyone', 'mute-video-everyone', 
          'security', 'whiteboard', 'reactions'
        ],
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'PURI Meet',
        PROVIDER_NAME: 'Dinas PUPR Kab. Garut',
        DEFAULT_BACKGROUND: '#0D1117',
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        FILM_STRIP_MAX_HEIGHT: 120,
        HIDE_INVITE_MORE_HEADER: false,
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DISABLE_TRANSCRIPTION_SUBTITLES: false,
      },
    };
  }

  // ----------------------------------------------------------
  // Official Government WhatsApp Invitation Formatter
  // ----------------------------------------------------------
  static generateOfficialInvitationMessage(meeting: Meeting, guestUrl: string): string {
    const scheduledDate = new Date(meeting.scheduledAt);
    const dateStr = scheduledDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = scheduledDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const meetingId = meeting.meetingIdDisplay || '849 203 1192';
    const passcode = meeting.passcode || '789123';

    return `*PEMERINTAH KABUPATEN GARUT*
*DINAS PEKERJAAN UMUM DAN PENATAAN RUANG*
Jl. Prof. KH. Cecep Syarifudin No. 117, Sukagalih, Tarogong Kidul, Kabupaten Garut

--------------------------------------------------
*UNDANGAN PERTEMUAN ONLINE (PURI MEET)*
--------------------------------------------------

Yth. Bapak/Ibu Peserta Pertemuan,

Dengan ini kami mengundang Bapak/Ibu untuk menghadiri pertemuan virtual via *PURI Meet Command Center* dengan rincian sebagai berikut:

📌 *Agenda:* ${meeting.title}
🏛️ *Bidang/Sektor:* ${meeting.bidang}
📅 *Hari/Tanggal:* ${dateStr}
⏰ *Waktu:* ${timeStr} WIB - Selesai

--------------------------------------------------
*AKSES PERTEMUAN (MEETING ACCESS)*
--------------------------------------------------
🔗 *Tautan Langsung Meeting (Jitsi):*
${guestUrl}

🆔 *Meeting ID:* \`${meetingId}\`
🔐 *Passcode:* \`${passcode}\`
--------------------------------------------------

*Catatan:*
1. Peserta diimbau untuk bergabung 5 (lima) menit sebelum acara dimulai.
2. Harap menggunakan nama resmi saat memasuki ruangan digital.

_Dinas PUPR Kabupaten Garut - PURI Smart Command Center_`;
  }
}
