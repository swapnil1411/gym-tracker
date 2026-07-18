"use client";

import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth-context";

type Mode = "login" | "signup" | "reset";

const input =
  "w-full rounded-xl border border-line bg-raised px-4 py-3.5 text-[15px] text-text placeholder:text-muted/70 outline-none focus:border-accent transition-colors";

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, resetPassword, configured } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!configured) {
    return (
      <main className="flex min-h-screen w-full max-w-app flex-col justify-center px-6">
        <h1 className="font-display text-2xl font-black tracking-[.14em]">
          GYM<span className="text-accent">·</span>LOG
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Firebase isn&apos;t configured yet. Copy <code className="text-text">.env.example</code> to{" "}
          <code className="text-text">.env.local</code>, add your{" "}
          <code className="text-text">NEXT_PUBLIC_FIREBASE_*</code> values, then restart the dev
          server. See the README for the full walkthrough.
        </p>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "login") await signIn(email.trim(), password);
      else if (mode === "signup") await signUp(email.trim(), password, name.trim());
      else {
        await resetPassword(email.trim());
        setNotice("Password reset link sent — check your inbox.");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Start training" : "Reset password";
  const cta = mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <main className="flex min-h-screen w-full max-w-app flex-col justify-center px-6 py-10">
      <div className="font-display text-[15px] font-black tracking-[.14em]">
        GYM<span className="text-accent">·</span>LOG
      </div>
      <h1 className="mt-6 font-display text-[34px] font-black uppercase leading-[.95] tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-muted">
        {mode === "reset"
          ? "We'll email you a link to set a new password."
          : "Your plan and history sync across every device."}
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
        {mode === "signup" && (
          <input
            className={input}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        )}
        <input
          className={input}
          type="email"
          inputMode="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        {mode !== "reset" && (
          <input
            className={input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-[#2A1614] px-3.5 py-2.5 text-[13px] text-[#FF8A6B]">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-[#14241C] px-3.5 py-2.5 text-[13px] text-done">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-accent px-4 py-3.5 font-body text-[15px] font-bold text-white transition disabled:opacity-60"
        >
          {busy ? "…" : cta}
        </button>
      </form>

      {mode !== "reset" && (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[.12em] text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button
            onClick={google}
            disabled={busy}
            className="flex items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-[15px] font-semibold transition hover:border-muted disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37.0 40.3 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Continue with Google
          </button>
        </>
      )}

      <div className="mt-7 flex flex-col gap-2 text-[13px] text-muted">
        {mode === "login" && (
          <>
            <button onClick={() => setMode("signup")} className="text-left">
              New here? <span className="font-semibold text-text">Create an account</span>
            </button>
            <button onClick={() => setMode("reset")} className="text-left">
              Forgot your password?
            </button>
          </>
        )}
        {mode === "signup" && (
          <button onClick={() => setMode("login")} className="text-left">
            Already have an account? <span className="font-semibold text-text">Log in</span>
          </button>
        )}
        {mode === "reset" && (
          <button onClick={() => setMode("login")} className="text-left">
            ← Back to log in
          </button>
        )}
      </div>
    </main>
  );
}
