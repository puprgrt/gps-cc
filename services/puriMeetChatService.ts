import { supabase } from '@/lib/supabase';
import type { ChatMessage, SendMessageInput } from '@/domain/puriMeetChat';

export class PuriMeetChatService {
  /**
   * Fetch chat messages for a specific meeting
   */
  static async fetchMessages(meetingId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('meeting_chat_messages')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      id: row.id,
      meetingId: row.meeting_id,
      senderName: row.sender_name,
      senderRole: row.sender_role,
      message: row.message,
      createdAt: row.created_at,
    }));
  }

  /**
   * Send a new chat message
   */
  static async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('meeting_chat_messages')
      .insert({
        meeting_id: input.meetingId,
        sender_name: input.senderName,
        sender_role: input.senderRole,
        message: input.message,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending chat message:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      meetingId: data.meeting_id,
      senderName: data.sender_name,
      senderRole: data.sender_role,
      message: data.message,
      createdAt: data.created_at,
    };
  }

  /**
   * Subscribe to new chat messages using Supabase Realtime
   */
  static subscribeToMessages(
    meetingId: string,
    onNewMessage: (message: ChatMessage) => void
  ) {
    // Gunakan nama channel unik per subscription untuk menghindari error
    // "cannot add postgres_changes callbacks... after subscribe()" pada React Strict Mode
    const uniqueChannelName = `chat_${meetingId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_chat_messages',
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          const row = payload.new;
          onNewMessage({
            id: row.id,
            meetingId: row.meeting_id,
            senderName: row.sender_name,
            senderRole: row.sender_role,
            message: row.message,
            createdAt: row.created_at,
          });
        }
      )
      .subscribe();
  }
}
