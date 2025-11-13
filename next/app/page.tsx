"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          PBJ LYFE
        </h1>
        <p className="text-2xl text-foreground">
          One simple daily flow to track your Lyfe.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/today"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
