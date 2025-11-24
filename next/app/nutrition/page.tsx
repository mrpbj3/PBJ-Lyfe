"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";

export default function Page() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8">
      <Link href="/today" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Today</Link>
      <h1 className="text-3xl font-bold capitalize">nutrition</h1>
      <p className="text-muted-foreground mt-2">Track your nutrition here.</p>
    </div>
  );
}
