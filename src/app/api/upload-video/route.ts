import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;

    if (!videoFile) {
      return NextResponse.json({ message: 'No video file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await videoFile.arrayBuffer());

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: `video-${session.user.id}-${Date.now()}.webm`,
      folder: `/pte-ace/videos/${session.user.id}/`,
    });

    return NextResponse.json({ 
        message: 'Video uploaded successfully', 
        videoUrl: uploadResponse.url,
        videoFileId: uploadResponse.fileId // Return the fileId
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to upload video to ImageKit:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
    return NextResponse.json({ message: `Upload failed: ${errorMessage}` }, { status: 500 });
  }
}
