"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "The reset email could not be sent. Try again shortly.",
      );
      return;
    }

    setIsSent(true);
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

          {isSent ? (
            <div className="recovery-complete">
              <span className="auth-heading-icon">
                <CheckCircle2 size={18} aria-hidden="true" />
              </span>
              <h1>Check your email</h1>
              <p>
                If {email.trim()} has an AMR Hub account, we just sent a
                password reset link to it. The link expires in 1 hour.
              </p>
              <Link className="primary-button" href="/login">
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <span className="auth-heading-icon">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <h1>Reset your password</h1>
                <p>
                  Enter your email and we&apos;ll send you a link to reset
                  your password.
                </p>
              </div>

              <form className="auth-form" onSubmit={requestReset}>
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

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="primary-button auth-submit"
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting && (
                    <LoaderCircle
                      className="spinning-icon"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                  {isSubmitting ? "Sending link" : "Send reset link"}
                </button>
              </form>

              <p className="auth-setup-link">
                Remembered your password? <Link href="/login">Return to sign in</Link>
              </p>
              <p className="auth-setup-link">
                Lost access to your email?{" "}
                <Link href="/forgot-password/recovery-code">
                  Use a recovery code
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      <aside className="auth-security-preview" aria-label="Reset security">
        <KeyRound size={28} aria-hidden="true" />
        <strong>Single-use reset link</strong>
        <p>
          The link is valid for 1 hour and works once. Resetting your
          password signs you out of every other session.
        </p>
      </aside>
    </div>
  );
}
