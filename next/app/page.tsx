// PBJ LYFE - Landing Page
"use client";

import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, Moon, Dumbbell, Zap, Brain, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Landing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Activity className="h-14 w-14 text-primary" />
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  PBJ LYFE
                </h1>
              </div>
            </div>
            <p className="text-3xl font-semibold text-foreground max-w-3xl mx-auto">
              One simple daily flow to track your Lyfe.
            </p>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your health, build streaks, and achieve sustainable health goals with mental health & lifestyle insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                size="lg"
                onClick={() => router.push('/login')}
                className="min-w-[200px] text-lg h-14"
                data-testid="button-login"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Win Your Day</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PBJ LYFE keeps it simple: one place to log, learn, and level up—without the noise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<TrendingDown className="h-10 w-10 text-chart-1" />}
            title="Food, Weight & Trends"
            description="Log meals in seconds and let PBJ LYFE do the math. See calories, protein, and weekly trend lines that smooth out the noise so you stay consistent—not obsessed."
            shortCopy="Quick logging, smart trends, real progress."
          />
          <FeatureCard
            icon={<Moon className="h-10 w-10 text-chart-2" />}
            title="Sleep & Recovery"
            description="Record sleep and quality each morning. PBJ LYFE highlights patterns and nudges you toward the 6–8 hour sweet spot that powers fat loss, focus, and mood."
            shortCopy="Better sleep, better days."
          />
          <FeatureCard
            icon={<Dumbbell className="h-10 w-10 text-chart-3" />}
            title="Workouts that Build"
            description="Track check-in/out times, exercises, sets, and PRs. Auto-progression suggestions keep you moving forward—even on busy weeks."
            shortCopy="Log it. Level up. Repeat."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-chart-4" />}
            title="Streaks that Stick"
            description="Green (3/3), Yellow (2/3), Red (0–1/3). Simple daily targets that build momentum, not guilt. Miss a day? PBJ LYFE helps you bounce back fast."
            shortCopy="Momentum you can feel."
          />
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-chart-5" />}
            title="Mind, Mood & Headspace"
            description="Tap in your mood, note dreams, breathe for a minute. PBJ LYFE connects mental health and habits so you can see what actually helps you feel good."
            shortCopy="Track how you feel, not just what you do."
          />
          <FeatureCard
            icon={<Heart className="h-10 w-10 text-destructive" />}
            title="Life, Social & Stress"
            description="Log work stress, social nights, and off days. PBJ LYFE shows how real-life choices affect sleep, weight, and workouts—no shame, just clarity."
            shortCopy="Real life, reflected in your data."
          />
        </div>
      </div>

      {/* Benefits Strip */}
      <div className="bg-muted/30 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <BenefitItem 
              title="Personal, not perfect" 
              subtitle="Rewards consistency over all-or-nothing streaks"
            />
            <BenefitItem 
              title="Your data, your pace" 
              subtitle="One simple daily flow—no clutter, no 20-step setup"
            />
            <BenefitItem 
              title="Whole-human view" 
              subtitle="Health + habits + headspace in one place"
            />
            <BenefitItem 
              title="Sustainable wins" 
              subtitle="Tiny actions that compound into big changes"
            />
          </div>
        </div>
      </div>

      {/* Microcopy Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 gap-8 text-center">
          <div className="p-6">
            <p className="text-2xl font-semibold text-primary mb-2">Log today. Win the week.</p>
          </div>
          <div className="p-6">
            <p className="text-2xl font-semibold text-primary mb-2">Small moves. Big momentum.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Missed a day? We'll help you restart. Your pace, your progress.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/login')}
            className="min-w-[240px] text-lg h-14"
            data-testid="button-login-cta"
          >
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 PBJ LYFE. Your health tracking companion.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  shortCopy,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  shortCopy: string;
}) {
  return (
    <div className="flex flex-col items-start p-6 rounded-xl border bg-card hover-elevate transition-all">
      <div className="mb-4 p-3 rounded-lg bg-muted/50">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3 flex-1">{description}</p>
      <p className="text-sm font-medium text-primary italic">{shortCopy}</p>
    </div>
  );
}

function BenefitItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
