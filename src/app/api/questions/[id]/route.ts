import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { Question } from '@/lib/types';

async function getQuestionsCollection(): Promise<Collection<Omit<Question, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<Question, 'id'>>('questions');
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { text, timer, difficulty } = await request.json();
    if (!text || !timer || !difficulty) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const questionsCollection = await getQuestionsCollection();
    const result = await questionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { text, timer, difficulty } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ message: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const questionsCollection = await getQuestionsCollection();
    const result = await questionsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ message: 'Failed to delete question' }, { status: 500 });
  }
}
