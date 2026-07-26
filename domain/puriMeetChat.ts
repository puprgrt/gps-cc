/**
 * PURI Meet Chat Domain Types
 * Smart Video Conference & Collaboration for GPS-CC
 *
 * Pure TypeScript interfaces — NO external imports allowed
 */

import type { ParticipantRole } from './puriMeet';

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderName: string;
  senderRole: ParticipantRole;
  message: string;
  createdAt: string; // ISO 8601
}

export interface SendMessageInput {
  meetingId: string;
  senderName: string;
  senderRole: ParticipantRole;
  message: string;
}
