import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession, Answer } from '@/lib/types';
import { getSession } from '@/lib/session';
import { scoreAndSaveSession } from '@/lib/ai-scoring';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { answers, idVerificationImageUrl } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ message: 'Missing or invalid answers array' }, { status: 400 });
    }

    const testSessionsCollection = await clientPromise.then(client => client.db("pte_ace").collection<Omit<TestSession, 'id'>>('testSessions'));

    const newTestSession: Omit<TestSession, 'id' | '_id'> = {
      studentId: session.user.id,
      answers,
      status: 'review-pending',
      startedAt: new Date(),
      completedAt: new Date(),
      idVerificationImageUrl,
    };
    
    const result = await testSessionsCollection.insertOne(newTestSession);
    const testSessionId = result.insertedId;

    // Run AI scoring in the background, don't block the response
    scoreAndSaveSession(testSessionId, answers).catch(err => {
        console.error(`Background scoring failed for session ${testSessionId}:`, err);
    });

    return NextResponse.json({ message: 'Test session saved successfully', testSessionId: testSessionId.toString() }, { status: 201 });
  } catch (error) {
    console.error('Failed to save test session:', error);
    return NextResponse.json({ message: 'Failed to save test session' }, { status: 500 });
  }
}
