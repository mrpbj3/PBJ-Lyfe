"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    // Wait for Supabase session to settle
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      router.push("/today");
    } else {
      setErr("Session did not initialize. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white/90 border p-6">

        <h1 className="text-3xl font-bold text-center mb-6">
          <span className="text-[#AB13E6]">PBJ</span>{" "}
          <span className="text-[#C38452]">LYFE</span>
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full border rounded-lg px-4 py-2"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border rounded-lg px-4 py-2"
            placeholder="••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          {err && <p className="text-red-500 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-white font-semibold"
            style={{ background: "#AB13E6", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
