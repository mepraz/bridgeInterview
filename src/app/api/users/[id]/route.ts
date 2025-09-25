import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { User } from '@/lib/types';
import { getSession } from '@/lib/session';

async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<User, 'id'>>('users');
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { isApproved } = await request.json();

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json({ message: 'Invalid `isApproved` value' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isApproved } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}
