"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Email or password is incorrect.");
      return;
    }
    router.push("/dashboard");
  }

  const input =
    "w-full rounded-lg border border-[#B9CDD3] bg-white px-3.5 py-3 text-base outline-none focus:border-[#1F8A8A] focus:ring-2 focus:ring-[#1F8A8A]/30";

  return (
    <main className="grid min-h-screen place-items-center bg-[#EAF2F4] px-4 text-[#0F2B33]">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-[#C9DADF] bg-white p-8"
      >
        <h1 className="text-2xl font-semibold">Staff sign in</h1>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={input} />
        </label>
        {error && <p role="alert" className="text-sm text-[#B3261E]">{error}</p>}
        <button disabled={busy}
          className="rounded-lg bg-[#0F2B33] px-5 py-3 font-semibold text-white hover:bg-[#1A4450] disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}