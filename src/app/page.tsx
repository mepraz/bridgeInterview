import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bot, BrainCircuit, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import Logo from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-20 text-center md:grid-cols-2 md:py-28 md:text-left">
          <div className="animate-fade-in-up space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter text-primary sm:text-5xl lg:text-6xl font-headline">
              Master Your PTE Exam with AI
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground md:mx-0">
              PTE Ace provides a realistic mock interview experience with real-time proctoring and AI-powered feedback to help you achieve your best score.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Your Free Mock Test <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="animate-fade-in">
            <img
              src="https://picsum.photos/seed/1/600/400"
              alt="AI powered learning illustration"
              width={600}
              height={400}
              className="mx-auto rounded-lg shadow-2xl"
              data-ai-hint="online test illustration"
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold">Why Choose PTE Ace?</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                Our platform is designed to give you the edge you need for your Pearson Test of English.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Bot />}
                title="AI-Powered Scoring"
                description="Get instant, detailed feedback and a 1-10 score on your answers, powered by advanced Gemini AI."
              />
              <FeatureCard
                icon={<BrainCircuit />}
                title="Adaptive Questioning"
                description="Our system adjusts question difficulty based on your performance, just like the real PTE exam."
              />
              <FeatureCard
                icon={<ShieldCheck />}
                title="Real-time Proctoring"
                description="Experience a true exam environment with tab and eye detection to ensure focus and integrity."
              />
              <FeatureCard
                icon={<CheckCircle />}
                title="Pre-Test Validation"
                description="Complete mandatory audio, video, and ID checks to ensure you're fully prepared for the test."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold">Get Started in 3 Simple Steps</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                A streamlined process to get you from registration to results efficiently.
              </p>
            </div>
            <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
                <div className="animate-fade-in-left">
                    <img
                    src="https://picsum.photos/seed/2/600/500"
                    alt="Illustration of a person taking an online test"
                    width={600}
                    height={500}
                    className="mx-auto rounded-lg shadow-xl"
                    data-ai-hint="student learning online"
                    />
                </div>
                <div className="space-y-8 animate-fade-in-right">
                    <Step number="1" title="Sign Up & Get Approved">
                        Create your student account in minutes. Our admins will quickly review and approve your registration so you can start practicing.
                    </Step>
                    <Step number="2" title="Complete Pre-Test Checks">
                        Our guided setup ensures your camera, microphone, and ID are verified, guaranteeing a smooth and fair test experience.
                    </Step>
                    <Step number="3" title="Take the Mock Test & Get Scored">
                        Answer adaptive questions in a real-time proctored environment. Once finished, our AI analyzes your performance, providing a detailed score and feedback.
                    </Step>
                </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-muted/50 py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold">Loved by Students Worldwide</h2>
              <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                Don't just take our word for it. Here's what our users are saying about their experience.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                <TestimonialCard
                    quote="PTE Ace was a game-changer for my preparation. The AI feedback was incredibly detailed and helped me identify weaknesses I didn't know I had."
                    name="Priya Sharma"
                    country="India"
                    avatarSeed="10"
                />
                <TestimonialCard
                    quote="The real-time proctoring made it feel like the actual exam. I was much more confident on test day because of this platform."
                    name="Carlos Rodriguez"
                    country="Spain"
                    avatarSeed="11"
                />
                <TestimonialCard
                    quote="As an admin, the dashboard is so intuitive. Approving students and reviewing test sessions is straightforward and efficient."
                    name="Admin User"
                    country="Australia"
                    avatarSeed="12"
                />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto border-t px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PTE Ace. All rights reserved. Developed by Mavtech.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="text-center bg-background/50 animate-fade-in-up transition-transform duration-300 hover:scale-105 hover:shadow-lg">
      <CardHeader>
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit text-primary">
          {icon}
        </div>
        <CardTitle className="mt-4 font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-headline text-2xl">
                {number}
            </div>
            <div>
                <h3 className="text-xl font-bold font-headline">{title}</h3>
                <p className="mt-1 text-muted-foreground">{children}</p>
            </div>
        </div>
    );
}

function TestimonialCard({ quote, name, country, avatarSeed }: { quote: string; name: string; country: string, avatarSeed: string }) {
    return (
        <Card className="bg-background animate-fade-in-up">
            <CardContent className="pt-6">
                <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-current" />)}
                </div>
                <blockquote className="text-muted-foreground italic">"{quote}"</blockquote>
            </CardContent>
            <CardHeader className="flex flex-row items-center gap-4">
                <img
                    src={`https://picsum.photos/seed/${avatarSeed}/40/40`}
                    alt={name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-ai-hint="person avatar"
                />
                <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">{country}</p>
                </div>
            </CardHeader>
        </Card>
    );
}
