"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  X,
} from "lucide-react";

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo((): PasswordStrength => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    const strengths: PasswordStrength[] = [
      { score: 0, label: "Very weak", color: "var(--red-500)" },
      { score: 1, label: "Weak", color: "var(--red-500)" },
      { score: 2, label: "Fair", color: "var(--amber-500)" },
      { score: 3, label: "Good", color: "var(--green-500)" },
      { score: 4, label: "Very good", color: "var(--green-600)" },
      { score: 5, label: "Excellent", color: "var(--green-700)" },
    ];

    return strengths[Math.min(score, 5)];
  }, [password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error || "Signup failed. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-layout">
        <section className="auth-form-pane">
          <div className="auth-form-wrap">
            <div className="auth-success">
              <div className="success-icon">
                <Check size={32} aria-hidden="true" />
              </div>
              <h1>Account created successfully!</h1>
              <p>Welcome to AMR Hub. Redirecting you to your workspace...</p>
              <LoaderCircle
                className="spinning-icon"
                size={20}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  const passwordScore = passwordStrength.score;
  const isPasswordWeak = passwordScore < 2;
  const passwordsMatch = password && confirmation && password === confirmation;

  return (
    <div className="auth-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap">
          <Link className="auth-back" href="/login">
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Link>

          <Link className="brand auth-brand" href="/signup">
            <span className="brand-mark">A</span>
            <span>
              <strong>AMR Hub</strong>
              <small>Product workspace</small>
            </span>
          </Link>

          <div className="auth-heading">
            <span className="auth-heading-icon">
              <Mail size={18} aria-hidden="true" />
            </span>
            <h1>Create account</h1>
            <p>Join your team and start collaborating today.</p>
          </div>

          {error && (
            <div className="auth-error">
              <X size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Full name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="John Doe"
                autoComplete="name"
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
                placeholder="john@example.com"
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 12 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
              {password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="strength-bar"
                        style={{
                          backgroundColor:
                            i < passwordScore
                              ? passwordStrength.color
                              : "var(--gray-200)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </label>

            <label className="form-field">
              <span>Confirm password</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
                {passwordsMatch && (
                  <div className="password-check">
                    <Check size={16} aria-hidden="true" />
                  </div>
                )}
              </div>
            </label>

            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) => setAgreeTerms(event.target.checked)}
                required
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="auth-link">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="auth-link">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || isPasswordWeak || !passwordsMatch}
              className="primary-button"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    className="spinning-icon"
                    size={16}
                    aria-hidden="true"
                  />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="auth-link">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
