/**
 * PURI Meet Transcription Domain Types
 * Smart Video Conference & Collaboration for GPS-CC
 */

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  duration?: number;
  language?: string;
}

export interface SavedTranscription {
  id: string;
  meetingId: string;
  transcriptionText: string;
  recordedBy: string;
  durationSeconds: number;
  createdAt: string;
}
