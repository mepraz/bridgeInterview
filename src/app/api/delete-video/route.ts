import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import ImageKit from 'imagekit';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession } from '@/lib/types';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ message: 'File ID is required' }, { status: 400 });
    }

    // 1. Delete the file from ImageKit
    await imagekit.deleteFile(fileId);

    // 2. Remove the video URL and file ID from the corresponding answer in the database
    const testSessionsCollection = await getTestSessionsCollection();
    await testSessionsCollection.updateOne(
        { "answers.videoFileId": fileId },
        { 
            $set: { 
                "answers.$.videoUrl": "",
                "answers.$.videoFileId": ""
            } 
        }
    );

    return NextResponse.json({ message: 'Video deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete video from ImageKit:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
    return NextResponse.json({ message: `Deletion failed: ${errorMessage}` }, { status: 500 });
  }
}
