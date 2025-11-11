// client/src/pages/Login.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Helper – production site URL (set VITE_SITE_URL in Vercel)
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;
const CALLBACK_URL = `${SITE_URL}/auth/callback`;

export default function Login() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSending(false);
    if (error) return setMessage(error.message);

    // After password sign-in, check if profile exists in Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  async function handleMagicLink() {
    setSending(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: CALLBACK_URL },
    });
    setSending(false);
    if (error) setMessage(error.message);
    else setMessage("Check your inbox for a secure sign-in link.");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: CALLBACK_URL },
    });
    setSending(false);
    if (error) setMessage(error.message);
    else setMessage("We sent you a confirmation email. Please confirm to continue.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white/90 border">
        <div className="p-6 text-center">
          <div className="text-3xl font-extrabold">
            <span className="text-[#AB13E6]">PBJ</span>{" "}
            <span className="text-[#C38452]">LYFE</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            One simple daily flow to track your Lyfe.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-6 pb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />

              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <Button className="w-full bg-[#AB13E6]" disabled={sending} type="submit">
                {sending ? "Signing in…" : "Sign in"}
              </Button>

              <Button variant="outline" className="w-full border-[#C38452] text-[#C38452]"
                type="button" disabled={sending} onClick={handleMagicLink}>
                Send me a magic link
              </Button>

              {message && <p className="text-sm text-destructive mt-2">{message}</p>}
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-3">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />

              <label className="text-sm font-medium">Create a password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <Button className="w-full bg-[#AB13E6]" disabled={sending} type="submit">
                {sending ? "Creating…" : "Create account"}
              </Button>

              {message && <p className="text-sm text-destructive mt-2">{message}</p>}
            </form>
          </TabsContent>
        </Tabs>

        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#C38452" }} />
            Secure by Supabase Auth
          </span>
        </div>
      </div>
    </div>
  );
}
