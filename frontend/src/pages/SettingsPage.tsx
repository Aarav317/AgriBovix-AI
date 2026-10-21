import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { UserRound, ShieldCheck, LogOut } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
import { ErrorMessage, Loading } from "../components/Status";
export default function SettingsPage() {
  const { workspace, health, healthError } =
    useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user, ready, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Profile & Settings</h1>
          <p>Your account and {c.name} service status.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel settings-panel">
          <UserRound size={30} />
          <h2>Your account</h2>
          {!ready ? (
            <Loading />
          ) : user ? (
            <>
              <dl>
                <dt>Name</dt>
                <dd>{user.name}</dd>
                <dt>Email</dt>
                <dd>{user.email}</dd>
                <dt>Active workspace</dt>
                <dd>{c.name}</dd>
              </dl>
              <p className="muted">
                Profile editing and password recovery are not available in this
                version.
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={signOut}
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <p>Sign in to save scans in your private history.</p>
              <Link
                className="button"
                to={`/auth/login?next=/${workspace}/settings`}
              >
                Sign In
              </Link>
            </>
          )}
          {error && <ErrorMessage message={error} />}
        </section>
        <section className="panel settings-panel">
          <ShieldCheck size={30} />
          <h2>Workspace services</h2>
          <dl>
            <dt>Backend connection</dt>
            <dd>
              {healthError ? "Offline" : health ? "Connected" : "Checking…"}
            </dd>
            <dt>Image analysis</dt>
            <dd>
              {health?.workspaces[workspace].analysis_configured
                ? "Model adapter configured"
                : "Unavailable · no model connected"}
            </dd>
            <dt>AI assistant</dt>
            <dd>
              {health?.workspaces[workspace].assistant_configured
                ? "Assistant adapter configured"
                : "Unavailable · no assistant connected"}
            </dd>
            <dt>Saved reports</dt>
            <dd>Private to your account and workspace</dd>
          </dl>
          <p className="muted">
            A configured service must still return a valid response before a
            result can be shown.
          </p>
          <Link className="text-link" to="/privacy">
            Read the privacy policy
          </Link>
        </section>
      </div>
    </>
  );
}
