"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/auth/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AllCheckinsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div className="p-8">Loading…</div>;
  if (!isAuthenticated) return <div className="p-8">Not authorized.</div>;

  const { data: checkins, error } = useQuery({
    queryKey: ["checkins-all", user?.id],
    queryFn: () => apiClient("/api/checkins/recent"),
    enabled: !!user,
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/today">
        <Button variant="ghost" className="mb-4">← Back</Button>
      </Link>

      <h1 className="text-3xl font-bold mb-6">All Check-Ins</h1>

      {error && <p className="text-red-500">Failed to load check-ins.</p>}

      {checkins?.length ? (
        <ul className="space-y-3">
          {checkins.map((c: any) => (
            <li
              key={c.id}
              className="border rounded-lg p-3 cursor-pointer hover:bg-muted"
              onClick={() =>
                (window.location.href = `/checkins/${c.for_date}`)
              }
            >
              <strong>{c.for_date}</strong> — Daily Check-In
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No check-ins available.</p>
      )}
    </div>
  );
}
