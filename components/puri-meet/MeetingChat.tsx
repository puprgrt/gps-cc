'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { PuriMeetChatService } from '@/services/puriMeetChatService';
import type { ChatMessage } from '@/domain/puriMeetChat';
import { cn } from '@/lib/utils';
import type { ParticipantRole } from '@/domain/puriMeet';

interface MeetingChatProps {
  meetingId: string;
  userName: string;
  userRole: ParticipantRole;
  className?: string;
}

export function MeetingChat({ meetingId, userName, userRole, className }: MeetingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    async function initChat() {
      try {
        const history = await PuriMeetChatService.fetchMessages(meetingId);
        if (mounted) {
          setMessages(history);
          setIsLoading(false);
          scrollToBottom();
        }

        // Subscribe to new messages
        subscription = PuriMeetChatService.subscribeToMessages(meetingId, (msg) => {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        });
      } catch (error) {
        console.error('Failed to init chat:', error);
        if (mounted) setIsLoading(false);
      }
    }

    initChat();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [meetingId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await PuriMeetChatService.sendMessage({
        meetingId,
        senderName: userName,
        senderRole: userRole,
        message: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/10", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 mt-10">
            Belum ada pesan. Mulai percakapan sekarang!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderName === userName;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">
                    {isMe ? 'Anda' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm",
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-slate-950 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan..."
            className="w-full bg-slate-900 text-sm text-white px-4 py-2.5 rounded-full pr-12 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/5"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="absolute right-1.5 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:bg-slate-700 transition-colors"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
