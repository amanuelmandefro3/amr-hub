"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) return;

    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "This link is invalid or has expired. Request a new one.",
      );
      return;
    }

    setPassword("");
    setConfirmation("");
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
              <p>Every existing session was signed out. Sign in with your new password.</p>
              <Link className="primary-button" href="/login">
                <ArrowLeft size={16} aria-hidden="true" />
                Return to sign in
              </Link>
            </div>
          ) : !token || linkError ? (
            <div className="recovery-complete">
              <span className="auth-heading-icon">
                <KeyRound size={18} aria-hidden="true" />
              </span>
              <h1>Link invalid or expired</h1>
              <p>Request a new password reset link and try again.</p>
              <Link className="primary-button" href="/forgot-password">
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <span className="auth-heading-icon">
                  <KeyRound size={18} aria-hidden="true" />
                </span>
                <h1>Set a new password</h1>
                <p>Choose a new password for your account.</p>
              </div>

              <form className="auth-form" onSubmit={resetPassword}>
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
                    autoFocus
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
                  disabled={isSubmitting || !password || !confirmation}
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
            </>
          )}
        </div>
      </section>

      <aside className="auth-security-preview" aria-label="Reset security">
        <KeyRound size={28} aria-hidden="true" />
        <strong>Single-use reset link</strong>
        <p>Resetting your password signs you out of every other session.</p>
      </aside>
    </div>
  );
}
