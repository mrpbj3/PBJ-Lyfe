"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/auth/AuthProvider";

export default function Page() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/login");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Link href="/today" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Today</Link>
      <h1 className="text-3xl font-bold capitalize">social</h1>
      <p className="text-muted-foreground mt-2">Track your social here.</p>
    </div>
  );
}
