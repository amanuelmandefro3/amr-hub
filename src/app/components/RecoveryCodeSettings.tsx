"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

type RecoveryStatus = {
  activeCount: number;
  createdAt: string | null;
  expiresAt: string | null;
};

function downloadCodes(codes: string[]) {
  const content = [
    "AMR Hub password recovery codes",
    "Each code resets your password once. Store these somewhere secure.",
    "",
    ...codes,
    "",
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "amr-hub-password-recovery-codes.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export default function RecoveryCodeSettings() {
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/recovery-codes", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Recovery status unavailable");
        return response.json() as Promise<RecoveryStatus>;
      })
      .then((result) => {
        if (active) setRecoveryStatus(result);
      })
      .catch(() => {
        if (active) setStatus("Recovery status could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, []);

  const generateCodes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsWorking(true);
    setStatus(null);
    setCopied(false);

    const response = await fetch("/api/recovery-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      codes?: string[];
      createdAt?: string;
      expiresAt?: string;
    } | null;
    setIsWorking(false);

    if (!response.ok || !result?.codes) {
      setStatus(result?.error ?? "Recovery codes could not be created.");
      return;
    }

    setPassword("");
    setCodes(result.codes);
    setRecoveryStatus({
      activeCount: result.codes.length,
      createdAt: result.createdAt ?? null,
      expiresAt: result.expiresAt ?? null,
    });
    setStatus(
      "New recovery codes created. Every previous recovery code is invalid.",
    );
  };

  const copyCodes = async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
  };

  const hasCodes = (recoveryStatus?.activeCount ?? 0) > 0;

  return (
    <section className="account-section recovery-code-section">
      <header>
        <span>
          <KeyRound size={17} aria-hidden="true" />
        </span>
        <div>
          <h2>Password recovery</h2>
          <p>
            {hasCodes
              ? `${recoveryStatus?.activeCount} one-time codes are ready.`
              : "Create offline codes before you lose access to your password."}
          </p>
        </div>
        <span className={`security-state ${hasCodes ? "enabled" : ""}`}>
          {hasCodes ? "Ready" : "Action needed"}
        </span>
      </header>

      {codes.length === 0 ? (
        <form className="recovery-code-form" onSubmit={generateCodes}>
          <label className="form-field">
            <span>Current password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className={hasCodes ? "secondary-button" : "primary-button"}
            type="submit"
            disabled={isWorking || !password}
          >
            {isWorking ? (
              <LoaderCircle
                className="spinning-icon"
                size={15}
                aria-hidden="true"
              />
            ) : hasCodes ? (
              <RefreshCw size={15} aria-hidden="true" />
            ) : (
              <KeyRound size={15} aria-hidden="true" />
            )}
            {hasCodes ? "Replace recovery codes" : "Create recovery codes"}
          </button>
        </form>
      ) : (
        <div className="backup-codes recovery-codes">
          <div>
            <strong>Store these codes now</strong>
            <p>
              They are shown once. Using any code resets your password, signs
              out every device, and invalidates the remaining codes.
            </p>
          </div>
          <div className="backup-code-grid">
            {codes.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
          <div className="backup-code-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void copyCodes()}
            >
              {copied ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy codes"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => downloadCodes(codes)}
            >
              <Download size={15} aria-hidden="true" />
              Download
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setCodes([])}
            >
              I stored them safely
            </button>
          </div>
        </div>
      )}

      {recoveryStatus?.expiresAt && codes.length === 0 && (
        <p className="account-status">
          Codes expire{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
          }).format(new Date(recoveryStatus.expiresAt))}
          .
        </p>
      )}
      {status && (
        <p className="account-status" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
