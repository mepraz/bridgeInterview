import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession, Question, User as UserType } from '@/lib/types';
import { getSession } from '@/lib/session';

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

async function getQuestionsCollection(): Promise<Collection<Omit<Question, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<Question, 'id'>>('questions');
}

async function getUsersCollection(): Promise<Collection<Omit<UserType, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<UserType, 'id'>>('users');
}

async function getTestSession(sessionId: string): Promise<(TestSession & { student?: UserType }) | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  const collection = await getTestSessionsCollection();
  const session = await collection.findOne({ _id: new ObjectId(sessionId) });
  if (!session) return null;

  const usersCollection = await getUsersCollection();
  const student = await usersCollection.findOne({ _id: new ObjectId(session.studentId) });

  return { 
      ...session, 
      id: session._id.toString(),
      student: student ? { ...student, id: student._id.toString(), password: '' } : undefined
    };
}

async function getQuestions(questionIds: string[]): Promise<Map<string, Question>> {
    const collection = await getQuestionsCollection();
    if (questionIds.length === 0) return new Map();
    const objectIds = questionIds.map(id => new ObjectId(id));
    const questions = await collection.find({ _id: { $in: objectIds } }).toArray();
    const map = new Map<string, Question>();
    questions.forEach(q => map.set(q._id.toString(), { ...q, id: q._id.toString() }));
    return map;
}

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const sessionData = await getSession();
  if (!sessionData.isLoggedIn || sessionData.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = params;
  if (!sessionId) {
    return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
  }

  try {
    const testSession = await getTestSession(sessionId);
    if (!testSession) {
      return NextResponse.json({ message: 'Test session not found' }, { status: 404 });
    }

    const questionIds = testSession.answers.map(a => a.questionId);
    const questionsMap = await getQuestions(questionIds);

    return NextResponse.json({ testSession, questionsMap: Object.fromEntries(questionsMap) });

  } catch (error) {
    console.error("Failed to fetch session details:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
