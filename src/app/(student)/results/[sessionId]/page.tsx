import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Bot, Mic, FileText, User, Star, Video } from 'lucide-react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import type { TestSession, Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';

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

async function getTestSession(sessionId: string, studentId: string): Promise<TestSession | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  const collection = await getTestSessionsCollection();
  const session = await collection.findOne({ _id: new ObjectId(sessionId), studentId });
  if (!session) return null;
  return { ...session, id: session._id.toString() };
}

async function getQuestions(questionIds: string[]): Promise<Map<string, Question>> {
    const collection = await getQuestionsCollection();
    const objectIds = questionIds.map(id => new ObjectId(id));
    const questions = await collection.find({ _id: { $in: objectIds } }).toArray();
    const map = new Map<string, Question>();
    questions.forEach(q => map.set(q._id.toString(), { ...q, id: q._id.toString() }));
    return map;
}


export default async function ResultsPage({ params }: { params: { sessionId: string } }) {
  const sessionData = await getSession();
  if (!sessionData.isLoggedIn || !sessionData.user) {
    redirect('/login');
  }

  const testSession = await getTestSession(params.sessionId, sessionData.user.id);

  if (!testSession) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">Test Session Not Found</h1>
        <p className="text-muted-foreground">The requested session does not exist or you do not have permission to view it.</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/dashboard">
                <ArrowLeft className="mr-2" />
                Back to Dashboard
            </Link>
        </Button>
      </div>
    );
  }
  
  const questionIds = testSession.answers.map(a => a.questionId);
  const questionsMap = await getQuestions(questionIds);

  return (
    <div className="container mx-auto py-8 sm:py-12">
        <div className="mb-6">
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Mock Test Results</CardTitle>
                    <CardDescription>
                        Test taken on {format(new Date(testSession.startedAt), 'MMMM d, yyyy, h:mm a')}
                    </CardDescription>
                </CardHeader>
            </Card>

            {testSession.answers.map((answer, index) => {
                const question = questionsMap.get(answer.questionId);
                return (
                    <Card key={index}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Question {index + 1}</CardTitle>
                                    <CardDescription className="mt-2 text-base">{question?.text}</CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-lg py-1 px-4">
                                    <Star className="mr-2 text-yellow-500" />
                                    {answer.score?.toFixed(1) || 'N/A'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {answer.videoUrl && (
                                <div className="mb-4">
                                    <h4 className="font-semibold flex items-center mb-2"><Video className="mr-2" /> Your Video Response</h4>
                                    <video src={`${answer.videoUrl}/ik-video.mp4?tr=orig`} controls className="w-full rounded-md aspect-video bg-muted"></video>
                                </div>
                            )}
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold flex items-center mb-2"><Mic className="mr-2" /> Your Answer</h4>
                                    <p className="text-muted-foreground italic">"{answer.transcript}"</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold flex items-center mb-2"><Bot className="mr-2" /> AI Feedback</h4>
                                    <p className="text-muted-foreground">{answer.feedback}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <CardDescription>Overall Score</CardDescription>
                    <CardTitle className="text-5xl font-headline">
                        {testSession.overallScore?.toFixed(1) || 'N/A'} / 10
                    </CardTitle>
                </CardHeader>
            </Card>

            {testSession.teacherFeedback && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><User className="mr-2" /> Teacher's Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <img src="/avatars/02.png" alt="Teacher" />
                                <AvatarFallback>T</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{testSession.teacherName || 'Admin'}</p>
                                <p className="text-xs text-muted-foreground">Feedback Provided</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground">{testSession.teacherFeedback}</p>
                    </CardContent>
                </Card>
            )}

        </div>
      </div>
    </div>
  );
}
