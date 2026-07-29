"use client";

import { useEffect, useState } from "react";
import {
  Laptop,
  LoaderCircle,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";
import {
  describeUserAgent,
  type SessionDevice,
} from "../../lib/sessionDisplay";

type SessionRecord = {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type SessionManagerProps = {
  currentSessionToken: string | null;
};

function DeviceIcon({ category }: { category: SessionDevice["category"] }) {
  if (category === "mobile") {
    return <Smartphone size={16} aria-hidden="true" />;
  }
  if (category === "tablet") {
    return <Tablet size={16} aria-hidden="true" />;
  }
  return <Monitor size={16} aria-hidden="true" />;
}

function formatActivity(value: Date) {
  const date = new Date(value);
  const differenceMinutes = Math.round((date.getTime() - Date.now()) / 60_000);

  if (Math.abs(differenceMinutes) < 1) return "Refreshed just now";
  if (Math.abs(differenceMinutes) < 60) {
    return `Refreshed ${new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(differenceMinutes, "minute")}`;
  }

  const differenceHours = Math.round(differenceMinutes / 60);
  if (Math.abs(differenceHours) < 24) {
    return `Refreshed ${new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(differenceHours, "hour")}`;
  }

  return `Refreshed ${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date)}`;
}

export default function SessionManager({
  currentSessionToken,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadSessions = async () => {
    const result = await authClient.listSessions();
    if (result.error || !result.data) {
      setStatus("Signed-in devices could not be loaded.");
      setIsLoading(false);
      return;
    }

    const ordered = [...result.data].sort((left, right) => {
      if (left.token === currentSessionToken) return -1;
      if (right.token === currentSessionToken) return 1;
      return (
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime()
      );
    });
    setSessions(ordered);
    setIsLoading(false);
  };

  useEffect(() => {
    let active = true;

    authClient.listSessions().then((result) => {
      if (!active) return;
      if (result.error || !result.data) {
        setStatus("Signed-in devices could not be loaded.");
        setIsLoading(false);
        return;
      }

      setSessions(
        [...result.data].sort((left, right) => {
          if (left.token === currentSessionToken) return -1;
          if (right.token === currentSessionToken) return 1;
          return (
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime()
          );
        }),
      );
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentSessionToken]);

  const revokeSession = async (token: string) => {
    setRevokingToken(token);
    setStatus(null);
    const result = await authClient.revokeSession({ token });
    setRevokingToken(null);

    if (result.error) {
      setStatus("That device could not be signed out.");
      return;
    }

    setStatus("Device signed out.");
    await loadSessions();
  };

  const revokeOtherSessions = async () => {
    setIsRevokingOthers(true);
    setStatus(null);
    const result = await authClient.revokeOtherSessions();
    setIsRevokingOthers(false);

    if (result.error) {
      setStatus("Other devices could not be signed out.");
      return;
    }

    setStatus("Every other device has been signed out.");
    await loadSessions();
  };

  const otherSessionCount = sessions.filter(
    ({ token }) => token !== currentSessionToken,
  ).length;

  return (
    <section className="account-section session-manager">
      <header>
        <span>
          <Laptop size={17} aria-hidden="true" />
        </span>
        <div>
          <h2>Signed-in devices</h2>
          <p>
            {isLoading
              ? "Checking active sessions"
              : `${sessions.length} active ${
                  sessions.length === 1 ? "session" : "sessions"
                }`}
          </p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void revokeOtherSessions()}
          disabled={isLoading || isRevokingOthers || otherSessionCount === 0}
        >
          {isRevokingOthers ? (
            <LoaderCircle
              className="spinning-icon"
              size={15}
              aria-hidden="true"
            />
          ) : (
            <LogOut size={15} aria-hidden="true" />
          )}
          Sign out other devices
        </button>
      </header>

      {isLoading ? (
        <div className="session-loading">
          <LoaderCircle
            className="spinning-icon"
            size={17}
            aria-hidden="true"
          />
          Loading devices
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => {
            const device = describeUserAgent(session.userAgent);
            const isCurrent = session.token === currentSessionToken;

            return (
              <div className="session-row" key={session.id}>
                <span className="session-device-icon">
                  <DeviceIcon category={device.category} />
                </span>
                <div className="session-identity">
                  <strong>
                    {device.browser}
                    {isCurrent && <span>Current device</span>}
                  </strong>
                  <span>
                    {device.platform}
                    {session.ipAddress ? ` - ${session.ipAddress}` : ""}
                  </span>
                </div>
                <div className="session-timing">
                  <strong>{formatActivity(session.updatedAt)}</strong>
                  <span>
                    Expires{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(session.expiresAt))}
                  </span>
                </div>
                {isCurrent ? (
                  <span className="current-session-check">This session</span>
                ) : (
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => void revokeSession(session.token)}
                    disabled={revokingToken === session.token}
                    aria-label={`Sign out ${device.browser} on ${device.platform}`}
                    title="Sign out this device"
                  >
                    {revokingToken === session.token ? (
                      <LoaderCircle
                        className="spinning-icon"
                        size={14}
                        aria-hidden="true"
                      />
                    ) : (
                      <LogOut size={14} aria-hidden="true" />
                    )}
                  </button>
                )}
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
