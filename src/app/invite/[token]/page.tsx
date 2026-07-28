"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  X,
} from "lucide-react";

interface InviteDetails {
  email: string;
  role: string;
  invitedBy: string;
  valid: boolean;
  message?: string;
}

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
};

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyInvite = async () => {
      try {
        const response = await fetch(`/api/invitations/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setInvite({
            email: "",
            role: "MEMBER",
            invitedBy: "",
            valid: false,
            message: data.message || "Invalid or expired invitation.",
          });
        } else {
          setInvite({ ...data, valid: true });
        }
      } catch (err) {
        setInvite({
          email: "",
          role: "MEMBER",
          invitedBy: "",
          valid: false,
          message: "Failed to verify invitation.",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [params.token]);

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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          name: name.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to accept invitation.");
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

  if (loading) {
    return (
      <div className="auth-layout">
        <section className="auth-form-pane">
          <div className="auth-form-wrap">
            <div className="auth-loading">
              <LoaderCircle
                className="spinning-icon"
                size={18}
                aria-hidden="true"
              />
              Verifying invitation...
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!invite?.valid) {
    return (
      <div className="auth-layout">
        <section className="auth-form-pane">
          <div className="auth-form-wrap">
            <Link className="brand auth-brand" href="/">
              <span className="brand-mark">A</span>
              <span>
                <strong>AMR Hub</strong>
                <small>Product workspace</small>
              </span>
            </Link>

            <div className="auth-error-full">
              <div className="error-icon">
                <X size={32} aria-hidden="true" />
              </div>
              <h1>Invalid invitation</h1>
              <p>{invite?.message || "This invitation is no longer valid."}</p>
              <Link href="/login" className="primary-button">
                Back to login
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-layout">
        <section className="auth-form-pane">
          <div className="auth-form-wrap">
            <div className="auth-success">
              <div className="success-icon">
                <Check size={32} aria-hidden="true" />
              </div>
              <h1>Welcome to the team!</h1>
              <p>Your account has been created. Redirecting you now...</p>
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
          <Link className="brand auth-brand" href="/">
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
            <h1>Join the team</h1>
            <p>Complete your account to start collaborating.</p>
          </div>

          <div className="invite-details">
            <p>
              <strong>{invite.invitedBy}</strong> invited you as{" "}
              <span className="role-badge">{invite.role}</span>
            </p>
            <p className="invite-email">{invite.email}</p>
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
                  <span style={{ color: passwordStrength.color }}>
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
                  Accepting invitation...
                </>
              ) : (
                "Accept invitation"
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
