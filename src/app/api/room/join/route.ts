import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { roomId, name, language } = await req.json();
    const db = await getDb();
    
    // Check if room exists
    const room = await db.get('SELECT id FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      return NextResponse.json({ error: 'Oda bulunamadı' }, { status: 404 });
    }

    const userId = crypto.randomUUID();

    await db.run(
      'INSERT INTO users (id, room_id, name, language) VALUES (?, ?, ?, ?)',
      [userId, roomId, name, language]
    );

    return NextResponse.json({ userId, name, language, roomId });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
