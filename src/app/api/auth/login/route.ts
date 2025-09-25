import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection } from 'mongodb';
import type { User, Session } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<User, 'id'>>('users');
}

async function getSessionsCollection(): Promise<Collection<Omit<Session, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<Session, 'id'>>('sessions');
}

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email, role });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password ?? "");

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const sessionsCollection = await getSessionsCollection();
    await sessionsCollection.insertOne({
      sessionToken,
      userId: user._id.toString(), // Convert ObjectId to string
      expires,
    });

    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    
    response.cookies.set('pte-ace-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
    return NextResponse.json({ message: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
