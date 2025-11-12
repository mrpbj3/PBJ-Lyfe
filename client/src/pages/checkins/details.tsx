// pages/checkins/details.tsx
// Display check-in details for a specific date
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'wouter';

export default function CheckinDetails() {
  const params = useParams();
  const date = params.date;

  const { data: answers, isLoading } = useQuery({
    queryKey: ['/api/checkins/:date', date],
    queryFn: async () => {
      const response = await fetch(`/api/checkins/${date}`);
      if (!response.ok) throw new Error('Failed to fetch checkin details');
      return response.json();
    },
    enabled: !!date,
  });

  const labelFor = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Group answers by section
  const groupedAnswers: Record<string, Array<{ key: string; value_text: string }>> = {};
  if (answers) {
    answers.forEach((answer: any) => {
      if (!groupedAnswers[answer.section]) {
        groupedAnswers[answer.section] = [];
      }
      groupedAnswers[answer.section].push({
        key: answer.key,
        value_text: answer.value_text,
      });
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/checkins/all">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Check-Ins
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          {date ? labelFor(date) : 'Check-In'} Details
        </h1>
        <p className="text-muted-foreground mb-8">Daily Check-In Results</p>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : answers && answers.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedAnswers).map(([section, sectionAnswers]) => (
              <DashboardCard key={section} title={section}>
                <div className="space-y-3">
                  {sectionAnswers.map((answer, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-sm font-medium capitalize">
                        {answer.key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm text-muted-foreground pl-4">
                        {answer.value_text}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            ))}
          </div>
        ) : (
          <DashboardCard title="No Data">
            <p className="text-muted-foreground">No check-in data found for this date.</p>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
