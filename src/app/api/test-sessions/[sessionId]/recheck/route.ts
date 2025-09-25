import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession } from '@/lib/types';
import { getSession } from '@/lib/session';
import { scoreAndSaveSession } from '@/lib/ai-scoring';

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = params;
  if (!ObjectId.isValid(sessionId)) {
      return NextResponse.json({ message: 'Invalid session ID' }, { status: 400 });
  }

  const testSessionsCollection = await clientPromise.then(client => client.db("pte_ace").collection<Omit<TestSession, 'id'>>('testSessions'));
  
  try {
    const testSessionToScore = await testSessionsCollection.findOne({ _id: new ObjectId(sessionId) });

    if (!testSessionToScore) {
        return NextResponse.json({ message: 'Test session not found' }, { status: 404 });
    }
    
    await testSessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { status: 'review-pending' } }
    );
    
    await scoreAndSaveSession(testSessionToScore._id, testSessionToScore.answers);
        
    return NextResponse.json({ message: 'Test session re-scoring triggered successfully.' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Failed to re-check test session ${sessionId}:`, error);
    
    await testSessionsCollection.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { status: 'review-failed' } }
    );

    return NextResponse.json({ message: `Re-check failed: ${errorMessage}` }, { status: 500 });
  }
}
