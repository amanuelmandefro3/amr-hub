"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type SetupStatus = {
  setupAvailable: boolean;
};

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status: SetupStatus) => {
        if (!status.setupAvailable) router.replace("/login");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setIsChecking(false));
  }, [router]);

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
      setError("Use at least 12 characters for the owner password.");
      return;
    }
    if (password !== confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bootstrap-token": bootstrapToken,
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    });

    if (!response.ok) {
      setError(
        response.status === 403
          ? "The setup token is invalid or this workspace is already claimed."
          : "The owner account could not be created.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  if (isChecking) {
    return (
      <div className="auth-loading">
        <LoaderCircle
          className="spinning-icon"
          size={18}
          aria-hidden="true"
        />
        Checking workspace
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-wrap">
        <Link className="back-link" href="/login">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </Link>

        <div className="setup-heading">
          <span className="auth-heading-icon">
            <ShieldCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Private workspace</p>
            <h1>Create the owner account</h1>
            <p>
              This one-time account controls access to the AMR Hub workspace.
            </p>
          </div>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Name</span>
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
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>
          </div>

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

          <label className="form-field">
            <span>Owner setup token</span>
            <input
              type="password"
              value={bootstrapToken}
              onChange={(event) => setBootstrapToken(event.target.value)}
              autoComplete="off"
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
              !bootstrapToken ||
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
              <Check size={16} aria-hidden="true" />
            )}
            {isSubmitting ? "Creating owner" : "Create owner account"}
          </button>
        </form>
      </div>
    </div>
  );
}
