"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  KeyRound,
  Laptop,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function AccountPage() {
  const { data: session } = authClient.useSession();
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const refreshSessions = () => {
    authClient.listSessions().then(({ data }) => {
      setSessionCount(data?.length ?? 1);
    });
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 12) {
      setPasswordStatus("Use at least 12 characters for the new password.");
      return;
    }
    if (newPassword !== confirmation) {
      setPasswordStatus("Password confirmation does not match.");
      return;
    }

    setIsChangingPassword(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setIsChangingPassword(false);

    if (result.error) {
      setPasswordStatus("The current password is incorrect.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setPasswordStatus("Password updated and other sessions signed out.");
    refreshSessions();
  };

  const revokeOtherSessions = async () => {
    setIsRevoking(true);
    setSessionStatus(null);
    const result = await authClient.revokeOtherSessions();
    setIsRevoking(false);

    if (result.error) {
      setSessionStatus("Other sessions could not be signed out.");
      return;
    }

    setSessionStatus("All other sessions have been signed out.");
    refreshSessions();
  };

  return (
    <div className="page account-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personal settings</p>
          <h1>Account security</h1>
          <p className="page-description">
            Manage your password and signed-in devices.
          </p>
        </div>
      </header>

      <div className="account-grid">
        <section className="account-profile">
          <span className="account-avatar">
            {session?.user.name
              ?.split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "AR"}
          </span>
          <div>
            <strong>{session?.user.name ?? "Workspace owner"}</strong>
            <span>{session?.user.email}</span>
          </div>
          <span className="role-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            {session?.user.role === "OWNER" ? "Owner" : "Member"}
          </span>
        </section>

        <section className="account-section">
          <header>
            <span>
              <KeyRound size={17} aria-hidden="true" />
            </span>
            <div>
              <h2>Change password</h2>
              <p>Other signed-in devices will be disconnected.</p>
            </div>
          </header>
          <form className="account-form" onSubmit={changePassword}>
            <label className="form-field">
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <div className="form-grid">
              <label className="form-field">
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
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
            </div>
            <div className="account-actions">
              {passwordStatus && (
                <p role="status">{passwordStatus}</p>
              )}
              <button
                className="primary-button"
                type="submit"
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmation
                }
              >
                {isChangingPassword && (
                  <LoaderCircle
                    className="spinning-icon"
                    size={15}
                    aria-hidden="true"
                  />
                )}
                Update password
              </button>
            </div>
          </form>
        </section>

        <section className="account-section">
          <header>
            <span>
              <Laptop size={17} aria-hidden="true" />
            </span>
            <div>
              <h2>Active sessions</h2>
              <p>
                {sessionCount === null
                  ? "Checking signed-in devices"
                  : `${sessionCount} active ${
                      sessionCount === 1 ? "session" : "sessions"
                    }`}
              </p>
            </div>
          </header>
          <div className="session-control">
            <div>
              <strong>Current browser</strong>
              <span>Keep this session and revoke every other one.</span>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void revokeOtherSessions()}
              disabled={isRevoking || sessionCount === 1}
            >
              {isRevoking && (
                <LoaderCircle
                  className="spinning-icon"
                  size={15}
                  aria-hidden="true"
                />
              )}
              Sign out other devices
            </button>
          </div>
          {sessionStatus && <p className="account-status">{sessionStatus}</p>}
        </section>
      </div>
    </div>
  );
}
