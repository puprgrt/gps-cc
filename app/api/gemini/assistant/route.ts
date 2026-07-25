import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Anda adalah Google Gemini AI Assistant resmi yang terintegrasi di Dashboard Executive Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut.
Tugas Anda adalah membantu Admin & Pimpinan PUPR dengan memberikan informasi ringkas, data analitis, ringkasan permohonan (PBG, SLF, KRK), status pengaduan (Jalan, Irigasi, Drainase), serta rekomendasi teknis/SLA dalam Bahasa Indonesia yang profesional, ramah, dan solutif.
Jawab dengan ringkas (2-4 kalimat) dan terstruktur.`;

    // Format chat contents if history is provided
    let contents: any = prompt;
    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.map((msg: { sender: string; text: string }) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      formattedHistory.push({
        role: 'user',
        parts: [{ text: prompt }]
      });
      contents = formattedHistory;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Assistant API error:", error);
    return NextResponse.json({ error: "Failed to generate AI assistant response" }, { status: 500 });
  }
}
