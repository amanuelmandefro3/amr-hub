"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  LoaderCircle,
} from "lucide-react";
import { authClient } from "../../lib/auth-client";
import {
  keyFromOrganizationName,
  organizationOnboardingSchema,
  slugFromOrganizationName,
} from "../../server/organizationSchemas";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [key, setKey] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const customSlug = useRef(false);
  const customKey = useRef(false);

  useEffect(() => {
    if (isSessionPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    let active = true;
    authClient.organization
      .list()
      .then(async (result) => {
        if (!active) return;
        const organization = result.data?.[0];
        if (organization) {
          await authClient.organization.setActive({
            organizationId: organization.id,
          });
          router.replace("/");
          router.refresh();
          return;
        }
        setIsChecking(false);
      })
      .catch(() => {
        if (active) {
          setError("Organization setup could not be loaded.");
          setIsChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isSessionPending, router, session]);

  const updateName = (nextName: string) => {
    setName(nextName);
    if (!customSlug.current) setSlug(slugFromOrganizationName(nextName));
    if (!customKey.current) setKey(keyFromOrganizationName(nextName));
    setSlugStatus(null);
  };

  const checkSlug = async () => {
    const parsed = organizationOnboardingSchema.shape.slug.safeParse(slug);
    if (!parsed.success) {
      setSlugStatus(
        parsed.error.issues[0]?.message ?? "Invalid workspace handle",
      );
      return;
    }

    setSlugStatus("Checking availability");
    const result = await authClient.organization.checkSlug({
      slug: parsed.data,
    });
    setSlugStatus(
      result.error
        ? "This workspace handle is already taken"
        : "Workspace handle is available",
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validation = organizationOnboardingSchema.safeParse({
      name,
      slug,
      key,
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ??
          "Check the organization details.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await authClient.organization.create(validation.data);

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "The workspace handle or key is already in use. Choose another value.",
      );
      setIsSubmitting(false);
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
        Preparing organization setup
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <section className="auth-form-pane">
        <div className="auth-form-wrap onboarding-form-wrap">
          <div className="auth-heading">
            <span className="auth-heading-icon">
              <Building2 size={18} aria-hidden="true" />
            </span>
            <p className="eyebrow">Step 2 of 2</p>
            <h1>Create your organization</h1>
            <p>This becomes the private workspace for you and your team.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Organization name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => updateName(event.target.value)}
                autoComplete="organization"
                placeholder="Acme Product"
                minLength={2}
                maxLength={80}
                required
                autoFocus
              />
            </label>

            <label className="form-field">
              <span>Workspace handle</span>
              <span className="workspace-slug-input">
                <span>@</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => {
                    customSlug.current = true;
                    setSlug(event.target.value.toLowerCase());
                    setSlugStatus(null);
                  }}
                  onBlur={() => void checkSlug()}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  minLength={3}
                  maxLength={48}
                  required
                />
              </span>
              {slugStatus && (
                <span
                  className={
                    slugStatus === "Workspace handle is available"
                      ? "field-status success"
                      : "field-status"
                  }
                >
                  {slugStatus === "Workspace handle is available" && (
                    <Check size={12} aria-hidden="true" />
                  )}
                  {slugStatus}
                </span>
              )}
            </label>

            <label className="form-field">
              <span>Issue key</span>
              <input
                className="organization-key-input"
                type="text"
                value={key}
                onChange={(event) => {
                  customKey.current = true;
                  setKey(event.target.value.toUpperCase());
                }}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                minLength={2}
                maxLength={5}
                placeholder="ACME"
                required
              />
              <span className="field-status">
                New issues will use identifiers such as {key || "ACME"}-1.
              </span>
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
                isSubmitting || !name.trim() || !slug.trim() || !key.trim()
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
              {isSubmitting ? "Creating workspace" : "Create workspace"}
            </button>
          </form>
        </div>
      </section>

      <aside className="auth-workspace-preview" aria-label="Setup progress">
        <div className="preview-topbar">
          <span className="brand-mark">A</span>
          <span>AMR Hub</span>
          <span className="preview-status">Account secured</span>
        </div>
        <div className="organization-preview">
          <span className="organization-preview-mark">
            {(key || "A").slice(0, 2)}
          </span>
          <div>
            <p>New organization</p>
            <strong>{name || "Your organization"}</strong>
            <span>{slug || "workspace-url"}</span>
          </div>
        </div>
        <div className="signup-preview-steps">
          <span className="complete">
            <Check size={14} aria-hidden="true" />
            Account credentials
          </span>
          <span className="active">
            <b>2</b>
            Organization details
          </span>
          <span>
            <b>3</b>
            Your first issue
          </span>
        </div>
      </aside>
    </div>
  );
}
