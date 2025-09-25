import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { Collection } from 'mongodb';
import type { Session } from '@/lib/types';

async function getSessionsCollection(): Promise<Collection<Omit<Session, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<Session, 'id'>>('sessions');
}

export async function GET() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('pte-ace-session')?.value;

  if (sessionToken) {
    const sessionsCollection = await getSessionsCollection();
    await sessionsCollection.deleteOne({ sessionToken });
  }
  
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

  // Instruct the browser to delete the cookie
  response.cookies.set('pte-ace-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}
