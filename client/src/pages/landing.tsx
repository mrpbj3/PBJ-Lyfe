// PBJ LYFE - Landing Page (single CTA)
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/auth/AuthProvider';

export default function Landing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    // If user already signed in, go to /today. Otherwise start server login flow.
    if (user) {
      navigate('/today', { replace: true });
    } else {
      window.location.href = '/api/login';
    }
  };

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

            {/* Single CTA */}
            <div className="pt-8">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="min-w-[240px] text-lg h-14"
                data-testid="button-login"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (kept minimal for readability) */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">Everything You Need to Win Your Day</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PBJ LYFE keeps it simple: one place to log, learn, and level up—without the noise.
          </p>
        </div>

        {/* (feature cards unchanged) */}
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