"use client";

import { FormEvent, useState } from "react";
import { Fingerprint, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { authClient } from "../../lib/auth-client";

export default function PasskeySettings() {
  const { data: passkeys, isPending, refetch } = authClient.useListPasskeys();
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const addPasskey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsAdding(true);

    const result = await authClient.passkey.addPasskey({
      name: name.trim() || undefined,
    });
    setIsAdding(false);

    if (result?.error) {
      setStatus("The passkey could not be added.");
      return;
    }

    setName("");
    setStatus("Passkey added.");
    await refetch();
  };

  const removePasskey = async (id: string) => {
    setRemovingId(id);
    setStatus(null);
    const result = await authClient.passkey.deletePasskey({ id });
    setRemovingId(null);

    if (result.error) {
      setStatus("The passkey could not be removed.");
      return;
    }

    setStatus("Passkey removed.");
    await refetch();
  };

  return (
    <section className="account-section">
      <header>
        <span>
          <Fingerprint size={17} aria-hidden="true" />
        </span>
        <div>
          <h2>Passkeys</h2>
          <p>Sign in with your device&apos;s fingerprint, face, or security key.</p>
        </div>
      </header>

      <form className="team-invite-form" onSubmit={addPasskey}>
        <label className="form-field">
          <span>Passkey name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Work laptop"
            maxLength={64}
          />
        </label>
        <button className="primary-button" type="submit" disabled={isAdding}>
          {isAdding ? (
            <LoaderCircle className="spinning-icon" size={15} aria-hidden="true" />
          ) : (
            <Plus size={15} aria-hidden="true" />
          )}
          Add a passkey
        </button>
      </form>

      {isPending ? (
        <div className="session-loading">
          <LoaderCircle className="spinning-icon" size={17} aria-hidden="true" />
          Loading passkeys
        </div>
      ) : (
        <div className="session-list">
          {passkeys?.map((passkey) => (
            <div className="session-row" key={passkey.id}>
              <span className="session-device-icon">
                <Fingerprint size={16} aria-hidden="true" />
              </span>
              <div className="session-identity">
                <strong>{passkey.name || "Passkey"}</strong>
                <span>
                  Added{" "}
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                    new Date(passkey.createdAt),
                  )}
                </span>
              </div>
              <button
                className="icon-button danger"
                type="button"
                onClick={() => void removePasskey(passkey.id)}
                disabled={removingId === passkey.id}
                aria-label={`Remove passkey ${passkey.name ?? passkey.id}`}
                title="Remove this passkey"
              >
                {removingId === passkey.id ? (
                  <LoaderCircle className="spinning-icon" size={14} aria-hidden="true" />
                ) : (
                  <Trash2 size={14} aria-hidden="true" />
                )}
              </button>
            </div>
          ))}
          {passkeys?.length === 0 && (
            <p className="activity-empty">No passkeys registered yet.</p>
          )}
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
