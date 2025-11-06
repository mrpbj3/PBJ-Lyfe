import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, TrendingDown, Moon, Dumbbell, Zap, Brain, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Landing(): JSX.Element {
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <section className="max-w-4xl w-full p-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">PBJ LYFE</h1>
          <nav className="space-x-4">
            <Link href="/login"><a className="text-sm text-slate-700">Log in</a></Link>
            <Link href="/signup"><a className="text-sm text-slate-700">Sign up</a></Link>
          </nav>
        </header>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-start gap-6">
            <div className="text-6xl text-indigo-600">
              <Zap />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Build healthy habits, one step at a time</h2>
              <p className="text-slate-600 mb-4">
                PBJ LYFE helps you track workouts, mood, and wins — designed to be simple and private.
              </p>

              <div className="flex gap-3">
                <Button onClick={() => setLocation("/signup")}>Get started</Button>
                <Button variant="ghost" onClick={() => setLocation("/login")}>Sign in</Button>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Activity size={16} /> Activity tracking</li>
                <li className="flex items-center gap-2"><Dumbbell size={16} /> Workouts</li>
                <li className="flex items-center gap-2"><Brain size={16} /> Mindset & mood</li>
                <li className="flex items-center gap-2"><Heart size={16} /> Personal goals</li>
              </ul>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-xs text-slate-500">
          <p>© PBJ LYFE</p>
        </footer>
      </section>
    </main>
  );
}
