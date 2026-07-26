import type { TranscriptionResult } from '@/domain/puriMeetTranscription';

export class PuriMeetTranscriptionService {
  /**
   * Transcribe an audio blob using our Next.js API route
   * which forwards it to OpenAI Whisper.
   */
  static async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioBlob);

    const response = await fetch('/api/whisper/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    return await response.json();
  }
}
