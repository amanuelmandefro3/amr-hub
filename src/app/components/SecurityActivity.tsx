"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

type SecurityEvent = {
  id: string;
  type: string;
  metadata: Record<string, string> | null;
  createdAt: string;
};

const eventVisuals: Record<string, { icon: typeof KeyRound; tone: string }> = {
  password_changed: { icon: KeyRound, tone: "blue" },
  password_reset: { icon: KeyRound, tone: "amber" },
  two_factor_enabled: { icon: ShieldCheck, tone: "green" },
  two_factor_disabled: { icon: ShieldCheck, tone: "red" },
  session_revoked: { icon: LogOut, tone: "blue" },
  sessions_revoked: { icon: LogOut, tone: "blue" },
  invitation_created: { icon: Mail, tone: "blue" },
  invitation_revoked: { icon: Trash2, tone: "gray" },
  invitation_accepted: { icon: Mail, tone: "green" },
  member_removed: { icon: UserRound, tone: "red" },
};

function describeEvent(event: SecurityEvent) {
  switch (event.type) {
    case "password_changed":
      return "Password changed";
    case "password_reset":
      return "Password reset";
    case "two_factor_enabled":
      return "Two-factor authentication enabled";
    case "two_factor_disabled":
      return "Two-factor authentication disabled";
    case "session_revoked":
      return "Signed out a device";
    case "sessions_revoked":
      return "Signed out other devices";
    case "invitation_created":
      return `Invited ${event.metadata?.email ?? "a new member"}`;
    case "invitation_revoked":
      return `Revoked the invitation for ${event.metadata?.email ?? "a member"}`;
    case "invitation_accepted":
      return "Joined the workspace";
    case "member_removed":
      return "Removed a workspace member";
    default:
      return event.type;
  }
}

export default function SecurityActivity() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/security-events", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Security activity unavailable");
        return response.json() as Promise<{ events: SecurityEvent[] }>;
      })
      .then((result) => {
        if (active) setEvents(result.events);
      })
      .catch(() => {
        if (active) setStatus("Security activity could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="account-section">
      <header>
        <span>
          <ShieldCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <h2>Security activity</h2>
          <p>A history of password, MFA, and access changes on your account.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="session-loading">
          <LoaderCircle className="spinning-icon" size={17} aria-hidden="true" />
          Loading activity
        </div>
      ) : events.length === 0 ? (
        <p className="activity-empty">No security activity yet.</p>
      ) : (
        <div className="activity-list" role="list">
          {events.map((event) => {
            const visual = eventVisuals[event.type] ?? {
              icon: ShieldCheck,
              tone: "gray",
            };
            const Icon = visual.icon;

            return (
              <div className="activity-row" key={event.id} role="listitem">
                <span className={`activity-event-icon activity-tone-${visual.tone}`}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="activity-event-copy">
                  <strong>{describeEvent(event)}</strong>
                </span>
                <span className="activity-event-meta">
                  <time
                    dateTime={event.createdAt}
                    title={new Date(event.createdAt).toLocaleString()}
                  >
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {status && (
        <p className="account-status" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
