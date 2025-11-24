"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const PBJ = {
  purple: "#AB13E6",
  gold: "#C38452",
};

function useFromParam() {
  return useMemo(() => {
    if (typeof window === "undefined") return "/";
    const url = new URL(window.location.href);
    return url.searchParams.get("from") || "/today";
  }, []);
}

export default function LoginPage() {
  const router = useRouter();
  const from = useFromParam();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // AUTO-REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session?.user) {
          router.replace("/today");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  // SIGN IN
  async function doSignIn() {
    setBusy(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    setBusy(false);
    if (error) return setErr(error.message);

    router.replace("/today");
  }

  // SIGN UP
  async function doSignUp() {
    setBusy(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setBusy(false);

    if (error) return setErr(error.message);

    setMsg("We sent you a confirmation email. Please verify to continue.");
  }

  // MAGIC LINK
  async function sendMagicLink() {
    if (!email) return setErr("Enter your email first.");

    setBusy(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setBusy(false);

    if (error) return setErr(error.message);

    setMsg("Magic link sent — check your inbox.");
  }

  // PASSWORD RESET
  async function handlePasswordReset() {
    if (!email) return setErr("Enter your email first.");

    setBusy(true);
    setMsg(null);
    setErr(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setBusy(false);

    if (error) return setErr(error.message);

    setMsg("Password reset email sent — check your inbox.");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: `linear-gradient(135deg, ${PBJ.purple}22 0%, ${PBJ.gold}22 40%, transparent 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
          {/* HEADER */}
          <div
            className="p-6 text-center"
            style={{
              background: `linear-gradient(180deg, ${PBJ.purple}10 0%, ${PBJ.gold}10 100%)`,
            }}
          >
            <div className="text-3xl font-extrabold tracking-tight">
              <span style={{ color: PBJ.purple }}>PBJ</span>{" "}
              <span style={{ color: PBJ.gold }}>LYFE</span>
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              One simple daily flow to track your Lyfe.
            </div>

            {/* TABS */}
            <div className="mt-5 inline-flex rounded-full bg-neutral-100 p-1">
              <button
                className={`px-4 py-1.5 text-sm rounded-full transition ${
                  tab === "signin"
                    ? "bg-white shadow text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setTab("signin")}
              >
                Sign in
              </button>

              <button
                className={`px-4 py-1.5 text-sm rounded-full transition ${
                  tab === "signup"
                    ? "bg-white shadow text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setTab("signup")}
              >
                Create account
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-4">
            {msg && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">
                {msg}
              </div>
            )}

            {err && (
              <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2 text-sm">
                {err}
              </div>
            )}

            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              style={{ "--pbj": PBJ.purple } as any}
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/** PASSWORD FIELD */}
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2"
                style={{ "--pbj": PBJ.purple } as any}
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((x) => !x)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            {/** ACTIONS */}
            {tab === "signin" ? (
              <>
                <button
                  onClick={doSignIn}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 font-medium text-white w-full"
                  style={{ background: PBJ.purple }}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>

                <button
                  onClick={handlePasswordReset}
                  disabled={busy}
                  className="text-sm hover:underline text-neutral-600"
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button
                onClick={doSignUp}
                disabled={busy}
                className="rounded-lg px-4 py-2 font-medium text-white w-full"
                style={{ background: PBJ.purple }}
              >
                {busy ? "Creating…" : "Create account"}
              </button>
            )}

            <button
              onClick={sendMagicLink}
              disabled={busy}
              className="rounded-lg px-4 py-2 font-medium border w-full"
              style={{ borderColor: PBJ.gold, color: PBJ.gold }}
            >
              {busy ? "Sending…" : "Send me a magic link"}
            </button>

            <p className="text-[11px] text-neutral-500 pt-2">
              By continuing you agree to PBJ LYFE’s terms & privacy.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500 mt-4">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1"
            style={{ background: PBJ.gold }}
          />
          Secure by Supabase Auth
        </div>
      </div>
    </div>
  );
}
