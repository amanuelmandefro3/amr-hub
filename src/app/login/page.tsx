"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningInWithPasskey, setIsSigningInWithPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
      return;
    }

  }, [router, session]);

  const goToWorkspace = async () => {
    const organizations = await authClient.organization.list();

    if (!organizations.error && organizations.data.length === 0) {
      router.replace("/onboarding");
      return;
    }

    if (!organizations.error && organizations.data[0]) {
      await authClient.organization.setActive({
        organizationId: organizations.data[0].id,
      });
    }

    router.replace("/dashboard");
    router.refresh();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe,
      callbackURL: "/onboarding",
    });

    if (result.error) {
      if (result.error.status === 429) {
        setError("Too many attempts. Wait a minute and try again.");
      } else if (result.error.code === "ACCOUNT_LOCKED") {
        setError(result.error.message ?? "Too many failed attempts. Try again shortly.");
      } else if (result.error.status === 403) {
        setError(
          "Verify your email before signing in. We just sent a new confirmation link to your inbox.",
        );
      } else {
        setError("Email or password is incorrect.");
      }
      setIsSubmitting(false);
      return;
    }

    if (result.data && "twoFactorRedirect" in result.data) {
      return;
    }

    await goToWorkspace();
  };

  const handlePasskeySignIn = async () => {
    setError(null);
    setIsSigningInWithPasskey(true);

    const result = await authClient.signIn.passkey();
    setIsSigningInWithPasskey(false);

    if (result?.error) {
      setError("Passkey sign-in did not complete. Try again or use your password.");
      return;
    }

    await goToWorkspace();
  };

  return (
    <div className="auth-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap">
          <Link className="brand auth-brand" href="/" aria-label="AMR Hub home">
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

            <div className="login-options">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Keep me signed in
              </label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>

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

          <button
            className="secondary-button auth-submit"
            type="button"
            onClick={() => void handlePasskeySignIn()}
            disabled={isSigningInWithPasskey}
          >
            {isSigningInWithPasskey ? (
              <LoaderCircle className="spinning-icon" size={16} aria-hidden="true" />
            ) : (
              <Fingerprint size={16} aria-hidden="true" />
            )}
            Sign in with a passkey
          </button>

          <p className="auth-setup-link">
            New to AMR Hub? <Link href="/signup">Create a workspace</Link>
          </p>
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
