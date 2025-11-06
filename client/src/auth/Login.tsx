import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    setLoading(false);
    setMsg(error ? error.message : 'Magic link sent. Check your email.');
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) setMsg(error.message);
    else window.location.href = '/today';
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <input className="w-full border p-2 rounded" type="email" placeholder="you@email.com"
               value={email} onChange={e => setEmail(e.target.value)} required />
        <button className="w-full border p-2 rounded" disabled={loading}>Send magic link</button>
      </form>

      <div className="my-6 text-center text-sm opacity-60">or</div>

      <form onSubmit={signInWithPassword} className="space-y-3">
        <input className="w-full border p-2 rounded" type="email" placeholder="email"
               value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="password"
               value={pw} onChange={e => setPw(e.target.value)} />
        <button className="w-full border p-2 rounded" disabled={loading}>Sign in with password</button>
      </form>

      {msg && <p className="text-sm mt-3">{msg}</p>}
    </div>
  );
}
