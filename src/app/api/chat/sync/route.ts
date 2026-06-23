import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });

    const db = await getDb();
    
    const query = `
      SELECT m.id, m.sender_id as senderId, m.original_text as originalText, m.translated_text as translatedText, m.created_at as createdAt, u.name as senderName, u.language as senderLanguage
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
    `;
    const messages = await db.all(query, [roomId]);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
