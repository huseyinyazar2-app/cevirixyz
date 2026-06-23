import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Oda ID gerekli' }, { status: 400 });
    }

    const db = await getDb();
    
    // First delete messages
    await db.run('DELETE FROM messages WHERE room_id = ?', [roomId]);
    
    // Then delete users
    await db.run('DELETE FROM users WHERE room_id = ?', [roomId]);
    
    // Finally delete the room
    await db.run('DELETE FROM rooms WHERE id = ?', [roomId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
