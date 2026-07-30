"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

type ChallengeMethod = "totp" | "backup";

export default function TwoFactorPage() {
  const router = useRouter();
  const [method, setMethod] = useState<ChallengeMethod>("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result =
      method === "totp"
        ? await authClient.twoFactor.verifyTotp({
            code: code.replace(/\s/g, ""),
            trustDevice,
          })
        : await authClient.twoFactor.verifyBackupCode({
            code: code.trim(),
            trustDevice,
          });

    setIsSubmitting(false);

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many failed attempts. Try again in 15 minutes."
          : method === "totp"
            ? "That authenticator code is invalid or expired."
            : "That backup code is invalid or has already been used.",
      );
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="auth-layout two-factor-layout">
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
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <h1>Verify it is you</h1>
            <p>Complete the second step to open your workspace.</p>
          </div>

          <div
            className="auth-method-tabs"
            role="tablist"
            aria-label="Verification method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={method === "totp"}
              className={method === "totp" ? "active" : ""}
              onClick={() => {
                setMethod("totp");
                setCode("");
                setError(null);
              }}
            >
              Authenticator
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "backup"}
              className={method === "backup" ? "active" : ""}
              onClick={() => {
                setMethod("backup");
                setCode("");
                setError(null);
              }}
            >
              Backup code
            </button>
          </div>

          <form className="auth-form" onSubmit={verify}>
            <label className="form-field">
              <span>
                {method === "totp" ? "Six-digit code" : "One-time backup code"}
              </span>
              <span className="challenge-input">
                <KeyRound size={17} aria-hidden="true" />
                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      method === "totp"
                        ? event.target.value.replace(/\D/g, "").slice(0, 6)
                        : event.target.value,
                    )
                  }
                  inputMode={method === "totp" ? "numeric" : "text"}
                  autoComplete="one-time-code"
                  minLength={method === "totp" ? 6 : 1}
                  maxLength={method === "totp" ? 6 : 64}
                  autoFocus
                  required
                />
              </span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(event) => setTrustDevice(event.target.checked)}
              />
              Trust this device for 30 days
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
                isSubmitting || (method === "totp" ? code.length !== 6 : !code)
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
              {isSubmitting ? "Verifying" : "Verify and continue"}
            </button>
          </form>

          <p className="auth-setup-link">
            Need to start again? <Link href="/login">Return to sign in</Link>
          </p>
        </div>
      </section>

      <aside className="auth-security-preview" aria-label="Account security">
        <ShieldCheck size={28} aria-hidden="true" />
        <strong>Two-step protection</strong>
        <p>
          Your password was accepted. This second check protects the workspace
          if that password is ever exposed.
        </p>
      </aside>
    </div>
  );
}
