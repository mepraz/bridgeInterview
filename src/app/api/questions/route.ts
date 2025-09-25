import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { Question } from '@/lib/types';

async function getQuestionsCollection(): Promise<Collection<Omit<Question, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<Question, 'id'>>('questions');
}

export async function GET() {
  try {
    const questionsCollection = await getQuestionsCollection();
    const questions = await questionsCollection.find({}).toArray();
    const questionsWithId = questions.map(q => ({...q, id: q._id.toString()}));
    return NextResponse.json(questionsWithId, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json({ message: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text, timer, difficulty } = await request.json();
    if (!text || !timer || !difficulty) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const questionsCollection = await getQuestionsCollection();
    const result = await questionsCollection.insertOne({ text, timer, difficulty });
    
    return NextResponse.json({ ...result, id: result.insertedId.toString() }, { status: 201 });

  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json({ message: 'Failed to create question' }, { status: 500 });
  }
}
