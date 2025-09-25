import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { getSession } from '@/lib/session';
import type { TestSession } from '@/lib/types';
import { redirect } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { Collection } from 'mongodb';

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

async function getTestSessions(studentId: string): Promise<TestSession[]> {
  const testSessionsCollection = await getTestSessionsCollection();
  const sessions = await testSessionsCollection.find({ studentId }).sort({ startedAt: -1 }).toArray();
  return sessions.map(s => ({ ...s, id: s._id.toString() }));
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== 'student') {
    redirect('/login');
  }
  const user = session.user;
  if (!user) {
    redirect('/login');
  }

  const userSessions = await getTestSessions(user.id);

  return (
    <div className="container mx-auto py-8 sm:py-12">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground mt-1">Here's your mock test dashboard.</p>
          </div>
          {user.isApproved ? (
            <Button size="lg" asChild>
              <Link href="/pre-test">Start New Mock Test</Link>
            </Button>
          ) : (
            <Button size="lg" disabled>Start New Mock Test</Button>
          )}
        </div>

        {!user.isApproved && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your account is currently awaiting admin approval. You will be able to start a new test once your account is approved.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>My Test History</CardTitle>
            <CardDescription>Review your past mock interview attempts and feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Overall Score</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSessions.length > 0 ? (
                  userSessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell>{format(new Date(session.startedAt), 'MMMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'review-complete' ? 'default' : 'secondary'} className={session.status === 'review-complete' ? 'bg-accent text-accent-foreground' : ''}>
                          {session.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {session.overallScore ? `${session.overallScore.toFixed(1)} / 10` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={session.status !== 'review-complete'}
                        >
                          <Link href={`/results/${session.id}`}>
                            View Results
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      No test sessions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
