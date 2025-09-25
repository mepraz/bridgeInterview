
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TestSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Star } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RETRY_PASSWORD = "0412";

export default function AdminTestSessionsPage() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-sessions/all');
      if (!response.ok) throw new Error('Failed to fetch test sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRecheck = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent row click
    const password = prompt("Enter the admin password to re-check the test:");
    if (password !== RETRY_PASSWORD) {
        if (password !== null) { // User didn't click cancel
            toast({ variant: "destructive", title: "Incorrect Password" });
        }
        return;
    }

    setIsRetryingId(sessionId);
    setError(null);
    try {
        const response = await fetch(`/api/test-sessions/${sessionId}/recheck`, {
            method: 'POST',
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to re-check session.');
        }

        toast({
            title: 'Success',
            description: 'AI scoring has been re-triggered. The page will refresh shortly.',
        });
        
        setTimeout(() => {
            fetchSessions();
        }, 5000);

    } catch (err) {
      const errorMessage = (err as Error).message;
      if (process.env.NODE_ENV === 'development') {
        setError(errorMessage);
      } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred during re-check.',
        });
      }
    } finally {
        setIsRetryingId(null);
    }
  };

  const handleRowClick = (sessionId: string) => {
    router.push(`/admin/test-sessions/${sessionId}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Test Sessions</h1>
          <p className="text-muted-foreground">View all student submissions and manage their status.</p>
        </div>

        <Card>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length > 0 ? sessions.map((session) => (
                      <TableRow key={session.id} onClick={() => handleRowClick(session.id)} className="cursor-pointer">
                        <TableCell>{(session as any).student?.name || 'Unknown Student'}</TableCell>
                        <TableCell>{format(new Date(session.startedAt), 'PPp')}</TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'review-complete' ? 'default' : 'secondary'} className={session.status === 'review-complete' ? 'bg-accent text-accent-foreground' : ''}>
                              {session.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {session.overallScore ? `${session.overallScore.toFixed(1)} / 10` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {session.status === 'review-failed' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleRecheck(e, session.id)}
                                disabled={isRetryingId === session.id}
                            >
                                {isRetryingId === session.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Re-check with AI
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No test sessions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Mobile Card View */}
                <div className="grid gap-4 md:hidden p-4">
                    {sessions.length > 0 ? sessions.map((session) => (
                        <Card key={session.id} onClick={() => handleRowClick(session.id)} className="cursor-pointer">
                            <CardHeader>
                                <CardTitle className="text-base">{(session as any).student?.name || 'Unknown'}</CardTitle>
                                <CardDescription>{format(new Date(session.startedAt), 'PPp')}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                <Badge variant={session.status === 'review-complete' ? 'default' : 'secondary'} className={session.status === 'review-complete' ? 'bg-accent text-accent-foreground' : ''}>
                                    {session.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <div className="font-medium flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    {session.overallScore ? `${session.overallScore.toFixed(1)} / 10` : 'N/A'}
                                </div>
                            </CardContent>
                            {session.status === 'review-failed' && (
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={(e) => handleRecheck(e, session.id)}
                                        disabled={isRetryingId === session.id}
                                    >
                                        {isRetryingId === session.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                        )}
                                        Re-check with AI
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    )) : (
                        <div className="h-24 text-center flex items-center justify-center">
                            <p>No test sessions found.</p>
                        </div>
                    )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Development Error</AlertDialogTitle>
            <AlertDialogDescription>
              An error occurred while re-checking the test. This dialog is only shown in development.
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-sm text-muted-foreground">
                {error}
              </pre>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
