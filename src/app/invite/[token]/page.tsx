"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
  MailCheck,
  ShieldAlert,
} from "lucide-react";
import { authClient } from "../../../lib/auth-client";

type InvitationDetails = {
  email: string;
  invitedBy: string;
  expiresAt: string;
};

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Invitation unavailable");
        return response.json() as Promise<InvitationDetails>;
      })
      .then(setInvitation)
      .catch(() => setInvitation(null))
      .finally(() => setIsChecking(false));
  }, [token]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (new Set(password).size >= 10) score += 1;
    if (/\s/.test(password) || /[^a-zA-Z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const signOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.refresh();
    setIsSigningOut(false);
  };

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
    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: name.trim(),
        password,
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(result?.error ?? "Your account could not be created.");
      setIsSubmitting(false);
      return;
    }

    const signIn = await authClient.signIn.email({
      email: invitation?.email ?? "",
      password,
      rememberMe: true,
    });

    if (signIn.error) {
      router.replace("/login");
      return;
    }

    router.replace("/");
    router.refresh();
  };

  if (isChecking || isSessionPending) {
    return (
      <div className="auth-loading">
        <LoaderCircle
          className="spinning-icon"
          size={18}
          aria-hidden="true"
        />
        Checking invitation
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="invite-page">
        <div className="invite-wrap invite-state">
          <span className="invite-state-icon invite-state-error">
            <ShieldAlert size={22} aria-hidden="true" />
          </span>
          <p className="eyebrow">Invitation unavailable</p>
          <h1>This link cannot be used</h1>
          <p>
            It may have expired, been revoked, or already been accepted. Ask
            the workspace owner for a new link.
          </p>
          <Link className="secondary-button" href="/login">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="invite-page">
        <div className="invite-wrap invite-state">
          <span className="invite-state-icon">
            <MailCheck size={22} aria-hidden="true" />
          </span>
          <p className="eyebrow">Team invitation</p>
          <h1>Switch accounts to continue</h1>
          <p>
            This invitation is for <strong>{invitation.email}</strong>. You are
            currently signed in as {session.user.email}.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => void signOut()}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <LoaderCircle
                className="spinning-icon"
                size={15}
                aria-hidden="true"
              />
            ) : (
              <LogOut size={15} aria-hidden="true" />
            )}
            Sign out to accept
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-wrap">
        <Link className="back-link" href="/login">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </Link>

        <div className="setup-heading invite-heading">
          <span className="auth-heading-icon">
            <MailCheck size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Team invitation</p>
            <h1>Join AMR Hub</h1>
            <p>
              {invitation.invitedBy} invited{" "}
              <strong>{invitation.email}</strong> as a workspace member.
            </p>
          </div>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
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
            {isSubmitting ? "Creating account" : "Accept invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
