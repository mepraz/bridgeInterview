'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Mic, User, Star, Eye, Video, Loader2, Trash2, UserCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { TestSession, Question, User as UserType, Answer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function AdminResultsPage() {
  const [testSession, setTestSession] = useState<(TestSession & { student?: UserType }) | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Map<string, Question>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [rawResponseToShow, setRawResponseToShow] = useState<string | null>(null);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState<string | null>(null);

  const params = useParams();
  const sessionId = params.sessionId as string;
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSessionData() {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/test-sessions/details/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session details');
        const data = await res.json();
        setTestSession(data.testSession);
        setQuestionsMap(new Map(Object.entries(data.questionsMap)));
        setTeacherFeedback(data.testSession.teacherFeedback || '');
      } catch (error)
        {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId, toast]);

  const handleFeedbackSubmit = async () => {
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/test-sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherFeedback }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit feedback.');
      }
      toast({
        title: 'Success',
        description: 'Teacher feedback has been saved.',
      });
       setTestSession(prev => prev ? { ...prev, teacherFeedback } : null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDeleteVideo = async (questionId: string, fileId: string | undefined) => {
    if (!fileId) {
      toast({ variant: 'destructive', title: 'Error', description: 'File ID is missing. Cannot delete.' });
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this video? This action cannot be undone.')) {
        return;
    }
    setIsDeletingVideo(questionId);
    try {
      const response = await fetch('/api/delete-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete video.');
      }
      
      toast({ title: 'Success', description: 'Video has been deleted.' });

      // Update the UI to remove the video URL
      setTestSession(prevSession => {
        if (!prevSession) return null;
        const updatedAnswers = prevSession.answers.map(ans => {
          if (ans.questionId === questionId) {
            return { ...ans, videoUrl: undefined, videoFileId: undefined };
          }
          return ans;
        });
        return { ...prevSession, answers: updatedAnswers };
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsDeletingVideo(null);
    }
  };


  if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!testSession) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">Test Session Not Found</h1>
        <p className="text-muted-foreground">The requested session does not exist.</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/admin/test-sessions">
                <ArrowLeft className="mr-2" />
                Back to Sessions List
            </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="container mx-auto py-8 sm:py-12">
          <div className="mb-6">
              <Button asChild variant="outline">
                  <Link href="/admin/test-sessions">
                      <ArrowLeft className="mr-2" />
                      Back to Sessions List
                  </Link>
              </Button>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-3xl font-headline">Mock Test Results for {testSession.student?.name}</CardTitle>
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
                                  <Badge variant={answer.score && answer.score > 0 ? 'default' : 'secondary'} className={`text-lg py-1 px-4 ${answer.score && answer.score > 0 ? 'bg-accent text-accent-foreground' : ''}`}>
                                      <Star className="mr-2 text-yellow-500" />
                                      {answer.score?.toFixed(1) || 'N/A'}
                                  </Badge>
                              </div>
                          </CardHeader>
                          <CardContent>
                              {answer.videoUrl ? (
                                <div className="mb-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-semibold flex items-center"><Video className="mr-2" /> Student's Video Response</h4>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteVideo(answer.questionId, answer.videoFileId)}
                                        disabled={isDeletingVideo === answer.questionId}
                                      >
                                        {isDeletingVideo === answer.questionId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                        Delete Video
                                      </Button>
                                    </div>
                                    <video src={`${answer.videoUrl}/ik-video.mp4?tr=orig`} controls className="w-full rounded-md aspect-video bg-muted"></video>
                                </div>
                              ) : (
                                <div className="mb-4 p-4 text-center border rounded-md bg-muted/50">
                                    <p className="text-muted-foreground">Video has been deleted or was not recorded.</p>
                                </div>
                              )}
                              <Separator className="my-4" />
                              <div className="space-y-4">
                                  <div>
                                      <h4 className="font-semibold flex items-center mb-2"><Mic className="mr-2" /> Student's Answer</h4>
                                      <p className="text-muted-foreground italic">"{answer.transcript || 'No transcript available.'}"</p>
                                  </div>
                                  <div>
                                      <h4 className="font-semibold flex items-center mb-2"><Bot className="mr-2" /> AI Feedback</h4>
                                      <p className="text-muted-foreground">{answer.feedback || 'No feedback available.'}</p>
                                  </div>
                              </div>
                          </CardContent>
                          <CardFooter>
                                {answer.rawAIResponse && (
                                    <Button variant="outline" size="sm" onClick={() => setRawResponseToShow(answer.rawAIResponse || 'No raw response captured.')}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View AI Response
                                    </Button>
                                )}
                          </CardFooter>
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

              {testSession.idVerificationImageUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><UserCheck className="mr-2" /> ID Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <img
                            src={testSession.idVerificationImageUrl}
                            alt="Student ID Verification"
                            width={500}
                            height={300}
                            className="rounded-md w-full object-cover"
                        />
                    </CardContent>
                </Card>
              )}

              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center"><User className="mr-2" /> Teacher's Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                       <p className="text-muted-foreground text-sm">
                          As an admin, you can provide final feedback to the student here.
                       </p>
                       <Textarea
                          placeholder="Provide constructive feedback for the student..."
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          rows={5}
                       />
                  </CardContent>
                  <CardFooter>
                      <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
                          {isSubmittingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Feedback
                      </Button>
                  </CardFooter>
              </Card>

          </div>
        </div>
      </div>
      <AlertDialog open={!!rawResponseToShow} onOpenChange={() => setRawResponseToShow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raw AI Response</AlertDialogTitle>
            <AlertDialogDescription>
              This is the raw, unparsed response from the AI model for debugging purposes.
              <pre className="mt-4 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm text-muted-foreground">
                {rawResponseToShow}
              </pre>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setRawResponseToShow(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
