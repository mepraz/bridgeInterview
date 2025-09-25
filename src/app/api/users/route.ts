import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection } from 'mongodb';
import type { User } from '@/lib/types';
import { getSession } from '@/lib/session';

async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<User, 'id'>>('users');
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const usersCollection = await getUsersCollection();
    const users = await usersCollection.find({ role: 'student' }).project({ password: 0 }).toArray();
    const usersWithId = users.map(u => ({ ...u, id: u._id.toString() }));
    return NextResponse.json(usersWithId, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
