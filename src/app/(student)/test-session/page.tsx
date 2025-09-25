
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Video, AlertTriangle, Send, BookOpen, UploadCloud, Ban } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Question, Answer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import EyeContactMonitor from '@/components/eye-contact-monitor';


// Function to shuffle an array and pick a few items
function shuffleAndPick<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const NUMBER_OF_QUESTIONS = 3;
const PREPARATION_TIME = 15; // 15 seconds to prepare

type UploadTask = {
  questionId: string;
  transcript: string;
  uploadPromise: Promise<{ videoUrl: string; videoFileId: string }>;
};

export default function TestSessionPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<'loading' | 'preparing' | 'answering' | 'saving' | 'completed' | 'terminated'>('loading');
  const [timer, setTimer] = useState(PREPARATION_TIME);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [completedUploads, setCompletedUploads] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // 1. Fetch questions and setup camera on component mount
  useEffect(() => {
    async function setupTest() {
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Failed to fetch questions.');
        const allQuestions: Question[] = await response.json();

        if (allQuestions.length < NUMBER_OF_QUESTIONS) {
          throw new Error(`Not enough questions in the database. Need at least ${NUMBER_OF_QUESTIONS}.`);
        }

        const selectedQuestions = shuffleAndPick(allQuestions, NUMBER_OF_QUESTIONS);
        setQuestions(selectedQuestions);
        setTestState('preparing');
      } catch (err) {
        setError((err as Error).message);
        toast({
          variant: 'destructive',
          title: 'Error setting up test',
          description: (err as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }

    setupTest();

    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      recognitionRef.current?.stop();
    };
  }, [toast]);

  // Tab Switching Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testState === 'answering') {
        setTestState('terminated');
        // Stop recording immediately
        mediaRecorderRef.current?.stop();
        recognitionRef.current?.stop();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testState]);


  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  });

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support the Speech Recognition API.',
      });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(prev => prev + finalTranscript);
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
    };

    recognitionRef.current = recognition;
  }, [toast]);

  // Start recording logic
  const startRecording = () => {
    if (mediaStreamRef.current && mediaRecorderRef.current?.state !== 'recording') {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start();
    }
  };

  // 2. Start recording and transcription when 'answering'
  useEffect(() => {
    if (testState === 'answering') {
      startRecording();
      setCurrentTranscript('');
      setupSpeechRecognition();
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
    }
  }, [testState, setupSpeechRecognition]);

  const saveTestSession = useCallback(async (finalAnswers: Answer[]) => {
    try {
      const idVerificationImageUrl = sessionStorage.getItem('idVerificationImageUrl');
      const response = await fetch('/api/test-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, idVerificationImageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save test session.');
      }
      sessionStorage.removeItem('idVerificationImageUrl');
      setTestState('completed');
    } catch (err) {
      setError((err as Error).message);
      toast({
        variant: 'destructive',
        title: 'Error Saving Session',
        description: (err as Error).message,
      });
      setTestState('completed'); // Go to completed screen even if save fails
    }
  }, [toast]);
  
  const finishTest = useCallback(async () => {
    setTestState('saving');
    try {
      const finalAnswers: Answer[] = await Promise.all(
        uploadTasks.map(async (task) => {
          const { videoUrl, videoFileId } = await task.uploadPromise;
          return {
            questionId: task.questionId,
            transcript: task.transcript,
            videoUrl: videoUrl,
            videoFileId: videoFileId,
          };
        })
      );
      await saveTestSession(finalAnswers);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error finalizing test',
        description: 'Some videos may not have been saved correctly.',
      });
      setTestState('completed');
    }
  }, [uploadTasks, saveTestSession, toast]);

  // Effect to trigger finishTest only when all upload tasks for all questions are created.
  useEffect(() => {
    if (uploadTasks.length > 0 && uploadTasks.length === questions.length) {
        finishTest();
    }
  }, [uploadTasks, questions, finishTest]);

  const handleStopRecordingAndStartUpload = useCallback(() => {
    recognitionRef.current?.stop();
  
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = () => {
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            
            const uploadPromise = new Promise<{ videoUrl: string; videoFileId: string }>(async (resolve, reject) => {
                try {
                    const formData = new FormData();
                    formData.append('video', videoBlob, `q-${questions[currentQuestionIndex].id}.webm`);

                    const uploadResponse = await fetch('/api/upload-video', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Video upload failed.');
                    }
                    const { videoUrl, videoFileId } = await uploadResponse.json();
                    resolve({ videoUrl, videoFileId });
                } catch (err) {
                    toast({
                        variant: 'destructive',
                        title: 'Upload Error',
                        description: (err as Error).message,
                    });
                    reject(err);
                } finally {
                    setCompletedUploads(prev => prev + 1);
                }
            });

            const newTask: UploadTask = {
                questionId: questions[currentQuestionIndex].id,
                transcript: currentTranscript.trim(),
                uploadPromise,
            };
            setUploadTasks(prev => [...prev, newTask]);
        };
    } else {
       // Handle cases where there's no recording (e.g., technical issue)
       const newTask: UploadTask = {
        questionId: questions[currentQuestionIndex].id,
        transcript: currentTranscript.trim(),
        uploadPromise: Promise.resolve({ videoUrl: '', videoFileId: '' }),
      };
      setUploadTasks(prev => [...prev, newTask]);
      setCompletedUploads(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions, currentTranscript, toast]);

  const handleNextQuestion = useCallback(() => {
    handleStopRecordingAndStartUpload();

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTestState('preparing');
      setTimer(PREPARATION_TIME);
    } 
    // The finishTest logic is now handled by the useEffect watching uploadTasks
  }, [currentQuestionIndex, questions.length, handleStopRecordingAndStartUpload]);

  // 3. Countdown timer logic
  useEffect(() => {
    if (testState !== 'preparing' && testState !== 'answering') return;

    const intervalId = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          if (testState === 'preparing') {
            setTestState('answering');
            if (questions.length > 0 && currentQuestionIndex < questions.length) {
              return questions[currentQuestionIndex].timer;
            }
            return 0;
          } else { // Answering
            handleNextQuestion();
            return 0;
          }
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [testState, questions, currentQuestionIndex, handleNextQuestion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Preparing your test...</p>
      </div>
    );
  }

  if (error && testState !== 'completed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Test Setup Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">Back to Dashboard</Button>
        </Alert>
      </div>
    );
  }
  
  if (testState === 'terminated') {
    return (
      <div className="container mx-auto py-8 sm:py-12 flex justify-center">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive">
                    <Ban className="h-8 w-8 text-destructive-foreground" />
                </div>
                <CardTitle className="mt-4 text-3xl font-headline">Test Terminated</CardTitle>
                <CardDescription>Your mock test has been stopped.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-destructive font-semibold">
                  Reason: The browser tab was changed or minimized during the test.
                </p>
                <p className="text-muted-foreground">
                    To ensure the integrity of the mock test, you must remain on the test page at all times. Please start a new test from your dashboard.
                </p>
                <Button onClick={() => router.push('/dashboard')} variant="outline">Back to Dashboard</Button>
            </CardContent>
        </Card>
      </div>
    );
  }


  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  const showUploadStatus = uploadTasks.length > 0 && completedUploads < uploadTasks.length;

  return (
    <div className="container mx-auto py-8 sm:py-12 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {(testState === 'preparing' || testState === 'answering') && currentQuestion && (
          <>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-headline font-bold">Mock Test in Progress</h1>
              <p className="text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <Progress value={progress} className="w-full" />

            {testState === 'preparing' ? (
              <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                <CardHeader>
                  <Alert className="mt-4 border-amber-500/50 text-amber-700">
                    <BookOpen className="h-4 w-4" />
                    <AlertTitle>Get Ready! ({timer}s)</AlertTitle>
                    <AlertDescription>
                      Read the question below. Your answer timer will begin shortly.
                    </AlertDescription>
                  </Alert>
                  <CardTitle className="text-2xl pt-6 select-none">{currentQuestion.text}</CardTitle>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Question {currentQuestionIndex + 1}:</CardTitle>
                  <CardDescription className="text-lg pt-2 select-none">{currentQuestion.text}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative p-4 border rounded-lg bg-muted/30">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-white p-2 rounded-md bg-destructive">
                      <Video className="h-5 w-5 animate-pulse" />
                      <span>REC</span>
                    </div>
                     {videoRef.current && (
                      <EyeContactMonitor videoElement={videoRef.current} />
                    )}
                  </div>
                  <div className="flex justify-center items-center p-4 border rounded-lg">
                    <span className="text-4xl font-bold font-mono text-primary">
                      {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                   <Button onClick={handleNextQuestion} size="lg" className="ml-auto">
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </>
        )}
        
        {testState === 'saving' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-headline font-bold">Submitting Your Test</h2>
                <p className="text-muted-foreground">Please wait while we save your session and upload your videos...</p>
                <Progress value={(completedUploads / questions.length) * 100} className="w-full max-w-sm mt-4" />
                <p className="text-sm text-muted-foreground mt-2">{completedUploads} of {questions.length} videos uploaded.</p>
            </div>
        )}

        {testState === 'completed' && (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Send className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="mt-4 text-3xl font-headline">Test Submitted!</CardTitle>
              <CardDescription>Your mock test has been completed and submitted for evaluation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {error && (
                 <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Submission Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
               )}
              <p className="text-muted-foreground">
                Your results will be processed by our AI and will be available on your dashboard shortly. Your videos have been saved for review.
              </p>
              <Button onClick={() => router.push('/dashboard')} variant="outline">Back to Dashboard</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showUploadStatus && (
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="bg-background/80 backdrop-blur-sm">
                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                            <p className="text-sm font-medium">Uploading videos...</p>
                            <p className="text-xs text-muted-foreground">{completedUploads} of {uploadTasks.length} completed</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
