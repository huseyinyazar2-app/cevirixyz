import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;
    const roomId = formData.get('roomId') as string;
    const userId = formData.get('userId') as string;

    if (!audioBlob || !roomId || !userId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get user and room info
    const user = await db.get('SELECT language, name FROM users WHERE id = ? AND room_id = ?', [userId, roomId]);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Get the other user's language in the room to know target translation
    const otherUser = await db.get('SELECT language FROM users WHERE room_id = ? AND id != ? LIMIT 1', [roomId, userId]);
    const targetLanguage = otherUser ? otherUser.language : (user.language === 'tr' ? 'nl' : 'tr');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API anahtarı eksik' }, { status: 500 });
    }

    let originalText = "Ses anlaşılamadı.";
    let translatedText = "Çeviri yapılamadı.";

    const ai = new GoogleGenAI({ apiKey });
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioBlob.type || 'audio/webm';

    const prompt = `You are a professional interpreter. Listen to this audio spoken in ${user.language}.
1. Transcribe exactly what is said.
2. Translate it accurately to ${targetLanguage}.
Return the result STRICTLY as a JSON object with two keys: "original" and "translated". Do not include markdown formatting or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
           role: 'user',
           parts: [
             { inlineData: { data: base64Audio, mimeType } },
             { text: prompt }
           ]
        }
      ]
    });

    try {
      const textResponse = response.text || "{}";
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      originalText = result.original || originalText;
      translatedText = result.translated || translatedText;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e, response.text);
    }

    const messageId = crypto.randomUUID();
    const createdAt = Date.now();

    await db.run(
      'INSERT INTO messages (id, room_id, sender_id, original_text, translated_text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, roomId, userId, originalText, translatedText, createdAt]
    );

    return NextResponse.json({ success: true, originalText, translatedText });

  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
