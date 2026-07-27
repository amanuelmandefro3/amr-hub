"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace("/");
      return;
    }

    fetch("/api/setup/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { setupAvailable?: boolean }) => {
        setSetupAvailable(data.setupAvailable === true);
      })
      .catch(() => setSetupAvailable(false));
  }, [router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe,
    });

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "Email or password is incorrect.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="auth-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap">
          <Link className="brand auth-brand" href="/login">
            <span className="brand-mark">A</span>
            <span>
              <strong>AMR Hub</strong>
              <small>Product workspace</small>
            </span>
          </Link>

          <div className="auth-heading">
            <span className="auth-heading-icon">
              <LockKeyhole size={18} aria-hidden="true" />
            </span>
            <h1>Sign in</h1>
            <p>Use your workspace account to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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
              <span>Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Keep me signed in
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="spinning-icon"
                  size={16}
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight size={16} aria-hidden="true" />
              )}
              {isSubmitting ? "Signing in" : "Continue"}
            </button>
          </form>

          {setupAvailable && (
            <p className="auth-setup-link">
              New workspace? <Link href="/setup">Create the owner account</Link>
            </p>
          )}
        </div>
      </section>

      <aside className="auth-workspace-preview" aria-label="Workspace preview">
        <div className="preview-topbar">
          <span className="brand-mark">A</span>
          <span>AMR Hub</span>
          <span className="preview-status">Protected workspace</span>
        </div>
        <div className="preview-summary">
          <p>Cycle 30</p>
          <strong>Product delivery</strong>
          <span>8 issues across active planning</span>
        </div>
        <div className="preview-issue-list">
          <span>
            <i className="preview-priority urgent" />
            <b>AMR-128</b>
            Checkout stalls after applying a promo code
          </span>
          <span>
            <i className="preview-priority high" />
            <b>AMR-127</b>
            Add saved views for support triage
          </span>
          <span>
            <i className="preview-priority medium" />
            <b>AMR-126</b>
            Improve empty state for new workspaces
          </span>
        </div>
      </aside>
    </div>
  );
}
