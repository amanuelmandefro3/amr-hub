import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bookmark,
  CalendarRange,
  Check,
  CircleCheck,
  Clock3,
  Gauge,
  Inbox,
  KeyRound,
  ListFilter,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Tag,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "AMR Hub | Product delivery without the noise",
  },
  description:
    "Triage issues, plan delivery cycles, and keep product work accountable in a secure organization workspace.",
};

const heroIssues = [
  {
    id: "AMR-128",
    title: "Checkout stalls after applying a promo code",
    priority: "Urgent",
    priorityClass: "urgent",
    status: "In progress",
    statusClass: "progress",
    owner: "MC",
  },
  {
    id: "AMR-127",
    title: "Add saved views for support triage",
    priority: "High",
    priorityClass: "high",
    status: "Backlog",
    statusClass: "backlog",
    owner: "AR",
  },
  {
    id: "AMR-126",
    title: "Improve first-run workspace state",
    priority: "Medium",
    priorityClass: "medium",
    status: "Done",
    statusClass: "done",
    owner: "JB",
  },
];

const triageIssues = [
  {
    id: "AMR-128",
    title: "Checkout stalls after applying a promo code",
    label: "Bug",
    labelClass: "bug",
    owner: "Maya",
    due: "Today",
  },
  {
    id: "AMR-127",
    title: "Add saved views for support triage",
    label: "Product",
    labelClass: "product",
    owner: "Amanuel",
    due: "Aug 2",
  },
  {
    id: "AMR-125",
    title: "Record status changes in issue activity",
    label: "Platform",
    labelClass: "platform",
    owner: "Jon",
    due: "Aug 4",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="brand landing-brand" href="/" aria-label="AMR Hub home">
            <span className="brand-mark">A</span>
            <span>
              <strong>AMR Hub</strong>
              <small>Product delivery</small>
            </span>
          </Link>

          <nav className="landing-nav" aria-label="Landing page navigation">
            <a href="#triage">Triage</a>
            <a href="#cycles">Cycles</a>
            <a href="#security">Security</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-signin" href="/login">
              Sign in
            </Link>
            <Link className="landing-header-cta" href="/signup">
              Create workspace
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">
              <Activity size={14} aria-hidden="true" />
              Mission control // Product operations
            </p>
            <h1>Clear the queue.<br />Ship the mission.</h1>
            <p className="landing-hero-statement">
              One focused command center for triage, delivery cycles, and every
              handoff between idea and shipped.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-primary-cta" href="/signup">
                Start a workspace
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="landing-secondary-cta" href="/dashboard">
                Open your workspace
              </Link>
            </div>
            <p className="landing-trust-line">
              <ShieldCheck size={15} aria-hidden="true" />
              Tenant-isolated data, revocable sessions, and two-factor protection
            </p>
          </div>

          <div className="landing-hero-scene" aria-hidden="true">
            <div className="landing-scene-topbar">
              <span className="landing-scene-mark">A</span>
              <strong>AMR Product</strong>
              <span className="landing-scene-search">Search workspace</span>
              <span className="landing-scene-avatar">AR</span>
            </div>
            <div className="landing-scene-body">
              <aside className="landing-scene-sidebar">
                <span className="active">
                  <Inbox size={13} />
                  Issues
                </span>
                <span>
                  <CalendarRange size={13} />
                  Cycles
                </span>
                <span>
                  <Bookmark size={13} />
                  Views
                </span>
              </aside>
              <div className="landing-scene-main">
                <div className="landing-scene-heading">
                  <div>
                    <small>Workspace</small>
                    <strong>Issues</strong>
                  </div>
                  <span>+ New issue</span>
                </div>
                <div className="landing-scene-tabs">
                  <span className="active">Active 12</span>
                  <span>Backlog 8</span>
                  <span>Completed 34</span>
                </div>
                <div className="landing-scene-table">
                  {heroIssues.map((issue) => (
                    <div className="landing-scene-row" key={issue.id}>
                      <i className={`landing-priority-dot ${issue.priorityClass}`} />
                      <span className="landing-scene-issue">
                        <small>{issue.id}</small>
                        <strong>{issue.title}</strong>
                      </span>
                      <span className={`landing-scene-priority ${issue.priorityClass}`}>
                        {issue.priority}
                      </span>
                      <span className={`landing-scene-status ${issue.statusClass}`}>
                        {issue.status}
                      </span>
                      <span className="landing-scene-owner">{issue.owner}</span>
                    </div>
                  ))}
                </div>
                <div className="landing-scene-pulse">
                  <div>
                    <small>Cycle 30</small>
                    <strong>18 / 26 points</strong>
                  </div>
                  <span>
                    <i style={{ height: "42%" }} />
                    <i style={{ height: "58%" }} />
                    <i style={{ height: "48%" }} />
                    <i style={{ height: "76%" }} />
                    <i style={{ height: "64%" }} />
                    <i style={{ height: "88%" }} />
                    <i style={{ height: "72%" }} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-capability-strip" aria-label="Core capabilities">
          <div className="landing-section-inner">
            <div>
              <Inbox size={17} aria-hidden="true" />
              <span>
                <strong>Decide from one queue</strong>
                <small>Priority, owner, due date, and status stay visible.</small>
              </span>
            </div>
            <div>
              <Gauge size={17} aria-hidden="true" />
              <span>
                <strong>Commit with capacity</strong>
                <small>Plan cycle scope before it becomes a promise.</small>
              </span>
            </div>
            <div>
              <LockKeyhole size={17} aria-hidden="true" />
              <span>
                <strong>Control every session</strong>
                <small>Protect accounts and revoke access by device.</small>
              </span>
            </div>
          </div>
        </section>

        <section className="landing-feature-section" id="triage">
          <div className="landing-section-inner landing-feature-grid">
            <div className="landing-feature-copy">
              <span className="landing-section-number">01 / Triage</span>
              <h2>A decision surface, not a backlog graveyard.</h2>
              <p>
                Scan urgency, ownership, workflow state, labels, and due dates
                without opening every issue. Save the exact view that support,
                product, or engineering needs next.
              </p>
              <ul className="landing-check-list">
                <li>
                  <Check size={15} aria-hidden="true" />
                  Filter and search without losing delivery context
                </li>
                <li>
                  <Check size={15} aria-hidden="true" />
                  Update status directly from the issue queue
                </li>
                <li>
                  <Check size={15} aria-hidden="true" />
                  Reuse personal views for recurring triage
                </li>
              </ul>
            </div>

            <div className="landing-triage-demo" aria-label="Issue triage preview">
              <div className="landing-demo-toolbar">
                <span>
                  <ListFilter size={14} aria-hidden="true" />
                  Support triage
                </span>
                <span>
                  <Tag size={14} aria-hidden="true" />
                  All labels
                </span>
              </div>
              <div className="landing-demo-summary">
                <strong>Active issues</strong>
                <span>12 in this view</span>
              </div>
              <div className="landing-demo-head" aria-hidden="true">
                <span>Issue</span>
                <span>Owner</span>
                <span>Due</span>
              </div>
              {triageIssues.map((issue) => (
                <div className="landing-demo-row" key={issue.id}>
                  <span className="landing-demo-issue">
                    <small>{issue.id}</small>
                    <strong>{issue.title}</strong>
                    <i className={issue.labelClass}>{issue.label}</i>
                  </span>
                  <span>{issue.owner}</span>
                  <time className={issue.due === "Today" ? "due" : ""}>
                    {issue.due}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cycle-section" id="cycles">
          <div className="landing-section-inner landing-cycle-grid">
            <div className="landing-cycle-visual" aria-label="Cycle capacity preview">
              <div className="landing-cycle-visual-head">
                <span>
                  <small>Current cycle</small>
                  <strong>Cycle 30</strong>
                </span>
                <span>Day 6 of 10</span>
              </div>
              <div className="landing-cycle-meter">
                <span>
                  <strong>69%</strong>
                  <small>complete</small>
                </span>
              </div>
              <div className="landing-cycle-stats">
                <span>
                  <strong>18</strong>
                  <small>Completed</small>
                </span>
                <span>
                  <strong>8</strong>
                  <small>Remaining</small>
                </span>
                <span>
                  <strong>2</strong>
                  <small>At risk</small>
                </span>
              </div>
              <div className="landing-capacity-track">
                <span />
              </div>
              <small className="landing-capacity-note">
                26 of 32 available points planned
              </small>
            </div>

            <div className="landing-feature-copy landing-cycle-copy">
              <span className="landing-section-number">02 / Delivery</span>
              <h2>Capacity is visible before scope becomes a promise.</h2>
              <p>
                Cycles connect issue estimates to a delivery window, expose
                unplanned work, and keep rollover risk visible while there is
                still time to act.
              </p>
              <div className="landing-inline-points">
                <span>
                  <CalendarRange size={16} aria-hidden="true" />
                  Time-boxed planning
                </span>
                <span>
                  <Gauge size={16} aria-hidden="true" />
                  Scope versus capacity
                </span>
                <span>
                  <Clock3 size={16} aria-hidden="true" />
                  At-risk due dates
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-security-section" id="security">
          <div className="landing-section-inner landing-security-grid">
            <div className="landing-brand-visual">
              <Image
                src="/og.png"
                width={1731}
                height={909}
                sizes="(max-width: 800px) 100vw, 48vw"
                alt="AMR Hub workspace overview with delivery chart and issue list"
              />
            </div>

            <div className="landing-feature-copy">
              <span className="landing-section-number">03 / Access</span>
              <h2>The workspace boundary is part of the product.</h2>
              <p>
                Every organization gets isolated issues, cycles, labels, and
                views. Owners control invitations and member access, while each
                person can inspect and revoke signed-in devices.
              </p>
              <div className="landing-security-list">
                <div>
                  <UsersRound size={17} aria-hidden="true" />
                  <span>
                    <strong>Organization isolation</strong>
                    <small>Workspace data follows active membership.</small>
                  </span>
                </div>
                <div>
                  <KeyRound size={17} aria-hidden="true" />
                  <span>
                    <strong>Layered account recovery</strong>
                    <small>TOTP, backup codes, and offline recovery codes.</small>
                  </span>
                </div>
                <div>
                  <MessageSquareText size={17} aria-hidden="true" />
                  <span>
                    <strong>Accountable activity</strong>
                    <small>Issue discussions and changes stay with the work.</small>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-section-inner">
            <span>
              <CircleCheck size={19} aria-hidden="true" />
              Ready for the next product decision
            </span>
            <h2>Give important work a clear next move.</h2>
            <p>
              Create the organization, invite the team, and start with an empty
              workspace that belongs only to you.
            </p>
            <div className="landing-final-actions">
              <Link className="landing-primary-cta" href="/signup">
                Create your workspace
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="landing-secondary-light" href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-section-inner">
          <Link className="brand" href="/">
            <span className="brand-mark">A</span>
            <strong>AMR Hub</strong>
          </Link>
          <p>Issue triage and delivery planning for focused software teams.</p>
          <div>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
