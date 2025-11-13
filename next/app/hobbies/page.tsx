"use client";
import Link from "next/link";
export default function Page() {
  return (
    <div className="min-h-screen p-8">
      <Link href="/today" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Today</Link>
      <h1 className="text-3xl font-bold capitalize">hobbies</h1>
      <p className="text-muted-foreground mt-2">Track your hobbies here.</p>
    </div>
  );
}
