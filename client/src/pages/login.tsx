import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

// PBJ brand
const PBJ = {
  purple: "#AB13E6",
  gold: "#C38452",
};

function useFromParam() {
  // preserve the page user tried to access
  return useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("from") || "/";
  }, []);
}

export default function Login() {
  const [, navigate] = useLocation();
  const from = useFromParam();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // If already logged in, bounce out
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.session.user.id)
            .maybeSingle();

          // If profile exists in table, go to today
          // If no profile or error, also go to today (lenient)
          navigate("/today");
        } catch (err) {
          console.log('Profile check error:', err);
          navigate("/today");
        }
      }
    })();
  }, [navigate]);

  async function doSignIn() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return setErr(error.message);

    // Check if profile is completed
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      // If profile exists in table, go to today
      // If no profile or error, also go to today (lenient)
      navigate("/today");
    } catch (err) {
      console.log('Profile check error:', err);
      navigate("/today");
    }
  }

  async function doSignUp() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // you already created this
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg("Check your email to confirm your account.");
  }

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
    setMsg("Magic link sent — check your email.");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          `linear-gradient(135deg, ${PBJ.purple}22 0%, ${PBJ.gold}22 40%, transparent 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
          {/* Header */}
          <div
            className="p-6 text-center"
            style={{
              background:
                `linear-gradient(180deg, ${PBJ.purple}10 0%, ${PBJ.gold}10 100%)`,
            }}
          >
            <div className="text-3xl font-extrabold tracking-tight">
              <span style={{ color: PBJ.purple }}>PBJ</span>{" "}
              <span style={{ color: PBJ.gold }}>LYFE</span>
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              One simple daily flow to track your Lyfe.
            </div>

            {/* Tabs */}
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

          {/* Body */}
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
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[color:var(--pbjPurple)]"
              style={{ "--pbjPurple": PBJ.purple } as React.CSSProperties}
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className={`${tab === "signin" || tab === "signup" ? "block" : "hidden"}`}>
              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[color:var(--pbjPurple)]"
                    style={{ "--pbjPurple": PBJ.purple } as React.CSSProperties}
                    placeholder="••••••••"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete={tab === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-800"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 grid gap-2">
              {tab === "signin" ? (
                <button
                  onClick={doSignIn}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60"
                  style={{ background: PBJ.purple }}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              ) : (
                <button
                  onClick={doSignUp}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60"
                  style={{ background: PBJ.purple }}
                >
                  {busy ? "Creating…" : "Create account"}
                </button>
              )}

              <button
                onClick={sendMagicLink}
                disabled={busy}
                className="rounded-lg px-4 py-2 font-medium border"
                style={{ borderColor: PBJ.gold, color: PBJ.gold }}
                title="We'll email you a one-time link"
              >
                {busy ? "Sending…" : "Send me a magic link"}
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 pt-2">
              By continuing you agree to PBJ LYFE’s terms & privacy. We’ll never post or
              share your data.
            </p>
          </div>
        </div>

        {/* Subtle footer */}
        <div className="text-center text-xs text-neutral-500 mt-4">
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PBJ.gold }} />
          Secure by Supabase Auth
        </div>
      </div>
    </div>
  );
}
