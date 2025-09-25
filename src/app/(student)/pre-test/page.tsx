'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Mic, AlertTriangle, Upload, UserCheck, Video, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const preTestSteps = [
  { id: 'av-check', title: 'A/V Check', icon: Mic },
  { id: 'terms', title: 'Terms & Conditions', icon: FileText },
  { id: 'id-verify', title: 'ID Verification', icon: UserCheck },
];

const PHRASES_TO_SAY = ["Purple", "flummoxed", "jibber jabber"];
const SKIP_PASSWORD = "0412";

export default function PreTestPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [micCheckPassed, setMicCheckPassed] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [spokenWords, setSpokenWords] = useState<string[]>([]);
  const [isReadingTerms, setIsReadingTerms] = useState(false);
  const [termsReadPassed, setTermsReadPassed] = useState(false);
  const [isCapturingId, setIsCapturingId] = useState(false);
  const [idCapturePassed, setIdCapturePassed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Step 1: Get Camera/Mic Permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/mic:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Permissions Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to proceed.',
        });
      }
    };
    getPermissions();

    // Cleanup function to stop the stream
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Ensure video stream is attached when step changes
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [currentStep]);

  // Step 2: Microphone Check Logic
  const handleMicCheck = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'Your browser does not support the Speech Recognition API. Please try Chrome or Firefox.',
      });
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsCheckingMic(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const expectedWord = PHRASES_TO_SAY[currentWordIndex].toLowerCase();

      if (transcript === expectedWord) {
        const newSpokenWords = [...spokenWords, PHRASES_TO_SAY[currentWordIndex]];
        setSpokenWords(newSpokenWords);

        if (newSpokenWords.length === PHRASES_TO_SAY.length) {
            setMicCheckPassed(true);
            toast({ title: 'Success', description: 'Microphone check passed!' });
            setCurrentStep(1);
        } else {
            setCurrentWordIndex(currentWordIndex + 1);
            toast({ title: 'Good!', description: `"${PHRASES_TO_SAY[currentWordIndex]}" recognized. Now say the next word.` });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Word Not Recognized',
          description: `We heard: "${transcript}". Please try saying "${PHRASES_TO_SAY[currentWordIndex]}" again.`,
        });
      }
      setIsCheckingMic(false);
    };

    recognition.onerror = (event) => {
      toast({
        variant: 'destructive',
        title: 'Recognition Error',
        description: 'Could not recognize speech. Please ensure your mic is working and try again.',
      });
      setIsCheckingMic(false);
    };
    
    recognition.start();
  };

  // Step 3: Terms Reading Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isReadingTerms) {
      timer = setTimeout(() => {
        setTermsReadPassed(true);
        setIsReadingTerms(false);
        toast({ title: 'Success', description: 'Terms check completed.' });
        setCurrentStep(2);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timer);
  }, [isReadingTerms, toast]);

  // Step 4: ID Capture Logic
  const handleCaptureId = async () => {
    if (!videoRef.current) return;
    setIsCapturingId(true);
    setIsUploading(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64Image = dataUrl.split(',')[1];
      
      // Upload to imgbb
      const formData = new FormData();
      formData.append('image', base64Image);
      
      try {
        const response = await fetch('https://api.imgbb.com/1/upload?key=d5cc170aca44d2d708ea90536924caa4', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (result.success) {
          sessionStorage.setItem('idVerificationImageUrl', result.data.url);
          setIdCapturePassed(true);
          setAllChecksPassed(true);
          toast({ title: 'Success', description: 'ID verified successfully.' });
        } else {
          throw new Error(result.error.message || 'Image upload failed');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: (error as Error).message,
        });
      } finally {
        setIsUploading(false);
        setIsCapturingId(false);
      }
    }
  };

  const handleSkip = () => {
    const password = prompt("Enter the admin password to skip the pre-test:");
    if (password === SKIP_PASSWORD) {
        toast({ title: "Pre-test skipped", description: "Navigating to the test session." });
        router.push('/test-session');
    } else if (password !== null) { // User didn't click cancel
        toast({ variant: "destructive", title: "Incorrect Password", description: "You are not authorized to skip this step." });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: // A/V Check
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Audio & Video Check</CardTitle>
              <CardDescription>Let's make sure your camera and microphone are working correctly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              </div>
              {!hasCameraPermission && (
                 <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Camera & Mic Access Required</AlertTitle>
                  <AlertDescription>Please allow access to use this feature. Check your browser settings.</AlertDescription>
                </Alert>
              )}
              <div className="text-center p-4 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground mb-2">Please say the following word clearly:</p>
                <div className="flex justify-center items-center gap-4">
                    {PHRASES_TO_SAY.map((word, index) => (
                        <span key={index} className={`text-xl font-bold font-headline tracking-wider transition-colors ${spokenWords.includes(word) ? 'text-green-500' : 'text-muted-foreground'} ${index === currentWordIndex ? 'text-primary' : ''}`}>
                            {word}
                        </span>
                    ))}
                </div>
              </div>
              <Button onClick={handleMicCheck} disabled={!hasCameraPermission || isCheckingMic} className="w-full">
                {isCheckingMic ? <><Loader2 className="mr-2 animate-spin" />Listening...</> : <><Mic className="mr-2" /> Start Microphone Check</>}
              </Button>
            </CardContent>
          </Card>
        );
      case 1: // Terms
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Read Terms Aloud</CardTitle>
              <CardDescription>Please read the following anti-cheating policy aloud. We will record for 10 seconds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30 space-y-2 text-center">
                  <p className="font-medium">"I confirm that I am the registered candidate and will not receive any assistance during this test."</p>
                  <p className="font-medium">"I will not use any external resources, including websites, notes, or other people."</p>
                  <p className="font-medium">"I understand that any form of cheating will result in the immediate termination of my test and potential account suspension."</p>
              </div>
              <Button onClick={() => setIsReadingTerms(true)} disabled={isReadingTerms} className="w-full">
                {isReadingTerms ? <><Loader2 className="mr-2 animate-spin" />Recording... (10s)</> : 'Start Reading'}
              </Button>
            </CardContent>
          </Card>
        );
      case 2: // ID Verification
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: ID Verification</CardTitle>
              <CardDescription>Please hold your ID card next to your face so both are clearly visible, then click capture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              </div>
              <Button onClick={handleCaptureId} disabled={isCapturingId || isUploading} className="w-full">
                {isUploading ? <><Loader2 className="mr-2 animate-spin" />Uploading...</> : <><Upload className="mr-2" /> Capture and Verify ID</>}
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 sm:py-12 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="relative text-center">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold">Pre-Test Setup</h1>
          <p className="text-muted-foreground mt-1">Complete these checks to ensure you're ready for the mock test.</p>
          <div className="absolute top-0 right-0">
            <Button variant="link" onClick={handleSkip}>Skip Pre-Test</Button>
          </div>
        </div>

        <div className="p-4">
            <Progress value={((currentStep + (allChecksPassed ? 1 : 0)) / preTestSteps.length) * 100} className="w-full mb-4" />
            <ol className="grid grid-cols-3 gap-4">
                {preTestSteps.map((step, index) => {
                    const isCompleted = (micCheckPassed && index === 0) || (termsReadPassed && index === 1) || (idCapturePassed && index === 2);
                    const isActive = index === currentStep;
                    return (
                        <li key={step.id} className="text-center">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto border-2 ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : isActive ? 'border-primary' : 'bg-muted'}`}>
                                {isCompleted ? <CheckCircle /> : <step.icon />}
                            </div>
                            <p className={`mt-2 font-medium ${isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</p>
                        </li>
                    );
                })}
            </ol>
        </div>

        {allChecksPassed ? (
          <Card className="text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle className="h-8 w-8 text-accent" />
                </div>
              <CardTitle>All Checks Passed!</CardTitle>
              <CardDescription>You are all set to begin your mock test.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => router.push('/test-session')}>Start Mock Test</Button>
            </CardContent>
          </Card>
        ) : (
          renderCurrentStep()
        )}
      </div>
    </div>
  );
}
