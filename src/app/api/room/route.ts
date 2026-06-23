import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST() {
  try {
    const db = await getDb();
    const roomId = crypto.randomBytes(4).toString('hex'); // 8 character id
    const createdAt = Date.now();

    await db.run('INSERT INTO rooms (id, created_at) VALUES (?, ?)', [roomId, createdAt]);

    return NextResponse.json({ roomId });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
