import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession, User } from '@/lib/types';
import { getSession } from '@/lib/session';

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

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
    const testSessionsCollection = await getTestSessionsCollection();
    const usersCollection = await getUsersCollection();
    
    const sessions = await testSessionsCollection.find({}).sort({ startedAt: -1 }).toArray();
    
    const studentIds = sessions.map(s => new ObjectId(s.studentId));
    const students = await usersCollection.find({ _id: { $in: studentIds } }).project({ name: 1 }).toArray();
    const studentsMap = new Map(students.map(s => [s._id.toString(), s]));

    const sessionsWithStudentData = sessions.map(s => ({
        ...s,
        id: s._id.toString(),
        student: studentsMap.get(s.studentId),
    }));

    return NextResponse.json(sessionsWithStudentData, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch test sessions:', error);
    return NextResponse.json({ message: 'Failed to fetch test sessions' }, { status: 500 });
  }
}
