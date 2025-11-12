// pages/checkins/all.tsx
// List all check-ins with pagination
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

export default function CheckinsAll() {
  const [page, setPage] = useState(0);
  const limit = 50;
  const offset = page * limit;

  const { data: checkins, isLoading } = useQuery({
    queryKey: ['/api/checkins/all', offset, limit],
    queryFn: async () => {
      const response = await fetch(`/api/checkins/all?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch checkins');
      return response.json();
    },
  });

  const labelFor = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/profile-detailed">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">All Check-Ins</h1>

        <DashboardCard title="Check-In History">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : checkins && checkins.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-accent">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Check-In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((c: any) => (
                      <tr
                        key={c.id}
                        className="hover:bg-muted cursor-pointer border-t"
                        onClick={() => (window.location.href = `/checkins/${c.for_date}`)}
                      >
                        <td className="p-3">{labelFor(c.for_date)}</td>
                        <td className="p-3">{labelFor(c.for_date)} Daily Check-In Results</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">Page {page + 1}</span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={checkins.length < limit}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No check-ins found.</p>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
