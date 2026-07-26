export interface WhatsAppConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'pairing_ready';
  qrCodeUrl?: string;
  qrCodeRaw?: string;
  pairingCode?: string;
  lastSync?: Date;
  phoneNumber?: string;
  activeSince?: string;
  userJid?: string;
  pushName?: string;
  baileysVersion?: string;
  sessionPath?: string;
  pingMs?: number;
}

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot' | 'operator';
  senderName?: string;
  text: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'document' | 'video' | 'audio' | 'location' | 'contact' | 'poll' | 'unknown';
  metadata?: {
    fileName?: string;
    mimetype?: string;
    fileUrl?: string;
    size?: number;
    caption?: string;
  };
  attachments?: {
    type: 'image' | 'pdf' | 'doc' | 'location';
    url: string;
    name?: string;
  }[];
}

export interface WhatsAppConversation {
  id: string;
  contactName: string;
  contactNumber: string;
  location?: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  status: 'active' | 'resolved' | 'bot_handling' | 'pending';
  category?: string;
  joinedDate?: string;
  totalChatCount?: number;
  messages: WhatsAppMessage[];
  aiSuggestedReply?: {
    text: string;
    confidence: number;
    source: string;
  };
  notes?: string[];
  tags?: string[];
  // PURI 6-Tier Hierarchical Routing Engine fields:
  bidang?: string | string[]; // e.g. "BINA_MARGA" or ["BANGUNAN_GEDUNG", "BINA_MARGA"]
  layanan?: string;           // e.g. "Jalan Kabupaten", "PBG"
  intent?: string;            // e.g. "PENGADUAN", "INFORMASI"
  prioritas?: 'RENDAH' | 'NORMAL' | 'TINGGI' | 'KRITIS' | string;
  sla?: string;               // e.g. "1 Hari", "< 2 Jam"
  assignedOperator?: string;  // e.g. "BM-01 (Online)"
  confidenceScore?: number;   // e.g. 99
  isEmergency?: boolean;      // e.g. true for critical road/bridge failure
  smartLabels?: string[];     // PURI Smart Labels array
}

export interface OperatorStatus {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  activeTask?: string;
}

export interface WhatsAppBotLog {
  id: string;
  timestamp: Date;
  event: string;
  details: string;
  level: 'info' | 'warn' | 'error';
}

