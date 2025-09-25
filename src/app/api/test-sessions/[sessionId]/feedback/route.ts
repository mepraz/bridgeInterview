import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession } from '@/lib/types';
import { getSession } from '@/lib/session';

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin' || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = params;
  if (!ObjectId.isValid(sessionId)) {
      return NextResponse.json({ message: 'Invalid session ID' }, { status: 400 });
  }
  
  try {
    const { teacherFeedback } = await request.json();
    if (typeof teacherFeedback !== 'string') {
        return NextResponse.json({ message: 'Invalid feedback provided.' }, { status: 400 });
    }

    const testSessionsCollection = await getTestSessionsCollection();
    const result = await testSessionsCollection.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          teacherFeedback,
          teacherName: session.user.name,
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Test session not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Feedback saved successfully.' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Failed to save feedback for session ${sessionId}:`, error);
    return NextResponse.json({ message: `Failed to save feedback: ${errorMessage}` }, { status: 500 });
  }
}
