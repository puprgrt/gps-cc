import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is not configured' }, { status: 500 });
    }

    // Build form data for OpenAI API
    const openAiFormData = new FormData();
    openAiFormData.append('file', file, 'audio.webm');
    openAiFormData.append('model', 'whisper-1');
    openAiFormData.append('language', 'id'); // Default to Indonesian
    openAiFormData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
      },
      body: openAiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to transcribe audio' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      text: data.text,
      language: data.language || 'id',
      duration: data.duration,
      segments: data.segments,
    });

  } catch (error: any) {
    console.error('Transcription route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
