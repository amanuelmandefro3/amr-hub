"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  UserPlus,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace("/onboarding");
  }, [router, session]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (new Set(password).size >= 10) score += 1;
    if (/\s/.test(password) || /[^a-zA-Z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }

    if (password !== confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many signup attempts. Wait a minute and try again."
          : "The account could not be created. Sign in if this email is already registered.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  };

  return (
    <div className="auth-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap signup-form-wrap">
          <Link className="back-link auth-back-link" href="/login">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to sign in
          </Link>

          <div className="auth-heading">
            <span className="auth-heading-icon">
              <UserPlus size={18} aria-hidden="true" />
            </span>
            <p className="eyebrow">Step 1 of 2</p>
            <h1>Create your account</h1>
            <p>Your organization workspace is created in the next step.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                autoFocus
              />
            </label>

            <label className="form-field">
              <span>Work email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <span className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
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
              <span className="password-strength">
                <span>
                  {Array.from({ length: 4 }, (_, index) => (
                    <i
                      className={index < passwordScore ? "active" : ""}
                      key={index}
                    />
                  ))}
                </span>
                {password.length < 12
                  ? "12 characters minimum"
                  : passwordScore >= 3
                    ? "Strong password"
                    : "Add length or variety"}
              </span>
            </label>

            <label className="form-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
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
                !name.trim() ||
                !email.trim() ||
                !password ||
                !confirmation
              }
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
              {isSubmitting ? "Creating account" : "Continue"}
            </button>
          </form>

          <p className="auth-setup-link">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>

      <aside className="auth-workspace-preview" aria-label="Workspace preview">
        <div className="preview-topbar">
          <span className="brand-mark">A</span>
          <span>Your organization</span>
          <span className="preview-status">Private by default</span>
        </div>
        <div className="preview-summary">
          <p>Organization workspace</p>
          <strong>One place for product delivery</strong>
          <span>Issues, planning, members, and account security stay together.</span>
        </div>
        <div className="signup-preview-steps">
          <span className="active">
            <b>1</b>
            Account credentials
          </span>
          <span>
            <b>2</b>
            Organization details
          </span>
          <span>
            <b>3</b>
            Your first issue
          </span>
        </div>
      </aside>
    </div>
  );
}
