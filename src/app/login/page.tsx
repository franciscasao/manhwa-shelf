"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

type Mode = "login" | "register";

export default function LoginPage() {
  const { login, register, user, isLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (password !== passwordConfirm) {
          setError("Passwords do not match.");
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setSubmitting(false);
          return;
        }
        await register(email, password, passwordConfirm);
      }
      router.replace("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setPassword("");
    setPasswordConfirm("");
  };

  // Show nothing while checking auth state
  if (isLoading || user) {
    return (
      <div className="font-mono min-h-screen bg-terminal-bg text-terminal-green flex items-center justify-center">
        <div className="text-xs">
          {">"} verifying credentials
          <span className="blink-cursor">_</span>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono relative min-h-screen overflow-hidden bg-terminal-bg text-terminal-green">
      {/* CRT scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 animate-[flicker_4s_infinite]">
        <div className="w-full max-w-md">
          {/* Terminal header */}
          <div className="mb-6 text-xs text-terminal-muted space-y-0.5">
            <div>
              {">"} manhwa-shelf v2.0 -- authentication module
            </div>
            <div>
              {">"} protocol: pocketbase-auth
              <span className="mx-2 text-terminal-muted">|</span>
              mode: {mode === "login" ? "LOGIN" : "REGISTER"}
            </div>
            <div className="text-terminal-green">
              {">"} awaiting credentials
              <span className="blink-cursor">_</span>
            </div>
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit}>
            <div className="border border-terminal-border p-4 md:p-6 space-y-4">
              {/* Mode indicator */}
              <div className="text-center text-sm text-terminal-cyan border-b border-terminal-border pb-3">
                <span className="text-terminal-dim">[</span>
                {mode === "login" ? "USER LOGIN" : "NEW USER REGISTRATION"}
                <span className="text-terminal-dim">]</span>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-[0.65rem] text-terminal-muted mb-1 tracking-widest">
                  EMAIL
                </label>
                <div className="flex items-center border border-terminal-border px-3 py-2 focus-within:border-terminal-cyan transition-colors">
                  <span className="mr-2 text-terminal-cyan text-sm shrink-0 select-none">
                    {">"}
                  </span>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 bg-transparent outline-none border-none text-terminal-green placeholder:text-terminal-muted font-mono text-sm"
                    style={{ caretColor: "#00d4ff" }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[0.65rem] text-terminal-muted mb-1 tracking-widest">
                  PASSWORD
                </label>
                <div className="flex items-center border border-terminal-border px-3 py-2 focus-within:border-terminal-cyan transition-colors">
                  <span className="mr-2 text-terminal-cyan text-sm shrink-0 select-none">
                    {">"}
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none border-none text-terminal-green placeholder:text-terminal-muted font-mono text-sm"
                    style={{ caretColor: "#00d4ff" }}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Confirm password (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-[0.65rem] text-terminal-muted mb-1 tracking-widest">
                    CONFIRM PASSWORD
                  </label>
                  <div className="flex items-center border border-terminal-border px-3 py-2 focus-within:border-terminal-cyan transition-colors">
                    <span className="mr-2 text-terminal-cyan text-sm shrink-0 select-none">
                      {">"}
                    </span>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none border-none text-terminal-green placeholder:text-terminal-muted font-mono text-sm"
                      style={{ caretColor: "#00d4ff" }}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="border border-terminal-orange/40 bg-terminal-orange/[0.03] px-3 py-2 text-xs space-y-0.5">
                  <div className="text-terminal-orange">
                    {">"} AUTH ERROR
                  </div>
                  <div className="text-terminal-orange/70">
                    {">"} {error}
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full border border-terminal-green/60 py-2 text-sm text-terminal-green hover:bg-terminal-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="animate-pulse">
                    {">"} {mode === "login" ? "AUTHENTICATING" : "REGISTERING"}
                    ...
                  </span>
                ) : (
                  <>
                    [ {mode === "login" ? "LOGIN" : "REGISTER"} ]
                  </>
                )}
              </button>

              {/* Toggle mode */}
              <div className="text-center text-xs text-terminal-dim pt-1">
                {mode === "login" ? (
                  <>
                    no account?{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-terminal-cyan hover:text-terminal-green transition-colors underline underline-offset-2"
                    >
                      register
                    </button>
                  </>
                ) : (
                  <>
                    already registered?{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-terminal-cyan hover:text-terminal-green transition-colors underline underline-offset-2"
                    >
                      login
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-4 text-[0.6rem] text-terminal-muted text-center">
            <span className="text-terminal-dim">[</span>
            <span className="text-terminal-green">OK</span>
            <span className="text-terminal-dim">]</span> auth-module v1.0
            <span className="mx-2">|</span>
            backend: pocketbase
          </div>
        </div>
      </div>
    </div>
  );
}
