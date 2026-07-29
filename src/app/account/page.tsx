"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Laptop,
  LoaderCircle,
  MailPlus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";

type WorkspaceAccess = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
    expiresAt: string;
    createdAt: string;
    invitedBy: string;
  }>;
};

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
  const [workspaceAccess, setWorkspaceAccess] =
    useState<WorkspaceAccess | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const refreshSessions = () => {
    authClient.listSessions().then(({ data }) => {
      setSessionCount(data?.length ?? 1);
    });
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const refreshWorkspaceAccess = async () => {
    const response = await fetch("/api/invitations", { cache: "no-store" });
    if (!response.ok) {
      setInviteStatus("Workspace access could not be loaded.");
      return;
    }
    setWorkspaceAccess((await response.json()) as WorkspaceAccess);
  };

  useEffect(() => {
    if (session?.user.role !== "OWNER") return;

    let active = true;
    fetch("/api/invitations", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Workspace access unavailable");
        return response.json() as Promise<WorkspaceAccess>;
      })
      .then((access) => {
        if (active) setWorkspaceAccess(access);
      })
      .catch(() => {
        if (active) setInviteStatus("Workspace access could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, [session?.user.role]);

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

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteStatus(null);
    setInviteUrl(null);
    setCopiedInvite(false);
    setIsInviting(true);

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      inviteUrl?: string;
    } | null;
    setIsInviting(false);

    if (!response.ok || !result?.inviteUrl) {
      setInviteStatus(result?.error ?? "Invitation could not be created.");
      return;
    }

    setInviteUrl(result.inviteUrl);
    setInviteEmail("");
    setInviteStatus(
      "Invitation link created. It is shown once, so copy it now.",
    );
    await refreshWorkspaceAccess();
  };

  const copyInvitation = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
  };

  const revokePendingInvitation = async (id: string) => {
    setRevokingInviteId(id);
    setInviteStatus(null);
    const response = await fetch(`/api/invitations/${id}`, {
      method: "DELETE",
    });
    setRevokingInviteId(null);

    if (!response.ok) {
      setInviteStatus("The invitation could not be revoked.");
      return;
    }

    setInviteStatus("Invitation revoked.");
    await refreshWorkspaceAccess();
  };

  const isOwner = session?.user.role === "OWNER";

  return (
    <div className="page account-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personal settings</p>
          <h1>Account and access</h1>
          <p className="page-description">
            Manage your password, signed-in devices, and workspace members.
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

        {isOwner && (
          <section className="account-section team-access-section">
            <header>
              <span>
                <UsersRound size={17} aria-hidden="true" />
              </span>
              <div>
                <h2>Team access</h2>
                <p>Create one-time links for trusted workspace members.</p>
              </div>
            </header>

            <form className="team-invite-form" onSubmit={createInvitation}>
              <label className="form-field">
                <span>Member email</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="member@example.com"
                  required
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? (
                  <LoaderCircle
                    className="spinning-icon"
                    size={15}
                    aria-hidden="true"
                  />
                ) : (
                  <MailPlus size={15} aria-hidden="true" />
                )}
                Create invite link
              </button>
            </form>

            {inviteUrl && (
              <div className="invite-link-result">
                <input
                  aria-label="New invitation link"
                  value={inviteUrl}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => void copyInvitation()}
                  aria-label="Copy invitation link"
                  title="Copy invitation link"
                >
                  {copiedInvite ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            )}

            {inviteStatus && (
              <p className="account-status" role="status">
                {inviteStatus}
              </p>
            )}

            <div className="team-access-group">
              <div className="team-access-heading">
                <strong>Members</strong>
                <span>{workspaceAccess?.users.length ?? 0}</span>
              </div>
              <div className="team-access-list">
                {workspaceAccess?.users.map((user) => (
                  <div className="team-access-row" key={user.id}>
                    <span className="team-member-avatar">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="team-access-identity">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </span>
                    <span className="team-role">
                      {user.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {(workspaceAccess?.invitations.length ?? 0) > 0 && (
              <div className="team-access-group">
                <div className="team-access-heading">
                  <strong>Invitations</strong>
                  <span>{workspaceAccess?.invitations.length}</span>
                </div>
                <div className="team-access-list">
                  {workspaceAccess?.invitations.map((invitation) => (
                    <div className="team-access-row" key={invitation.id}>
                      <span className="team-member-avatar pending">
                        <MailPlus size={15} aria-hidden="true" />
                      </span>
                      <span className="team-access-identity">
                        <strong>{invitation.email}</strong>
                        <span>
                          Created by {invitation.invitedBy} on{" "}
                          {new Date(
                            invitation.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </span>
                      <span
                        className={`invitation-status invitation-${invitation.status.toLowerCase()}`}
                      >
                        {invitation.status.toLowerCase()}
                      </span>
                      {invitation.status === "PENDING" && (
                        <button
                          className="icon-button danger"
                          type="button"
                          onClick={() =>
                            void revokePendingInvitation(invitation.id)
                          }
                          disabled={revokingInviteId === invitation.id}
                          aria-label={`Revoke invitation for ${invitation.email}`}
                          title="Revoke invitation"
                        >
                          {revokingInviteId === invitation.id ? (
                            <LoaderCircle
                              className="spinning-icon"
                              size={15}
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2 size={15} aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
