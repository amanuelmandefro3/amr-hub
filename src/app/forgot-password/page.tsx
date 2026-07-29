"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/recovery-codes/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result?.error ?? "The password could not be reset.");
      return;
    }

    setPassword("");
    setConfirmation("");
    setCode("");
    setIsComplete(true);
  };

  return (
    <div className="auth-layout recovery-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap">
          <Link className="brand auth-brand" href="/login">
            <span className="brand-mark">A</span>
            <span>
              <strong>AMR Hub</strong>
              <small>Product workspace</small>
            </span>
          </Link>

          {isComplete ? (
            <div className="recovery-complete">
              <span className="auth-heading-icon">
                <CheckCircle2 size={18} aria-hidden="true" />
              </span>
              <h1>Password updated</h1>
              <p>
                Every existing session and recovery code was invalidated. Sign
                in with your new password and create a fresh recovery set.
              </p>
              <Link className="primary-button" href="/login">
                <ArrowLeft size={16} aria-hidden="true" />
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <span className="auth-heading-icon">
                  <KeyRound size={18} aria-hidden="true" />
                </span>
                <h1>Recover your account</h1>
                <p>Use one of the password recovery codes you stored earlier.</p>
              </div>

              <form className="auth-form" onSubmit={resetPassword}>
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoFocus
                  />
                </label>
                <label className="form-field">
                  <span>Recovery code</span>
                  <input
                    className="recovery-code-input"
                    type="text"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    autoComplete="one-time-code"
                    spellCheck={false}
                    maxLength={64}
                    placeholder="AMR-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>New password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Confirm password</span>
                  <input
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </label>

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="primary-button auth-submit"
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !email.trim() ||
                    !code.trim() ||
                    !password ||
                    !confirmation
                  }
                >
                  {isSubmitting && (
                    <LoaderCircle
                      className="spinning-icon"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                  {isSubmitting ? "Resetting password" : "Reset password"}
                </button>
              </form>

              <p className="auth-setup-link">
                Remembered your password? <Link href="/login">Return to sign in</Link>
              </p>
            </>
          )}
        </div>
      </section>

      <aside className="auth-security-preview" aria-label="Recovery security">
        <KeyRound size={28} aria-hidden="true" />
        <strong>Offline recovery</strong>
        <p>
          Recovery codes remain under your control and are stored by AMR Hub
          only as irreversible hashes.
        </p>
      </aside>
    </div>
  );
}
