import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';

export default function WaitingForApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <MailCheck className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Registration Successful!</CardTitle>
          <CardDescription>
            Your account has been created. An administrator will review your registration shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You will receive an email notification once your account is approved. After approval, you will be able to log in and start your PTE mock test. Thank you for your patience.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
