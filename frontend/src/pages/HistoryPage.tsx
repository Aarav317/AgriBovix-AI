import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  History,
  ArrowRight,
  Search,
  Trash2,
  FileText,
  RefreshCw,
  X,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import type { Report } from "../types";
import { useAuth } from "../hooks/AuthContext";
import { api } from "../services/api";
import { workspaceConfig } from "../services/workspaces";
import { ErrorMessage, Loading } from "../components/Status";
import { ReportPanel } from "../components/ReportPanel";
export default function HistoryPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user, ready } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const data = await api.history(workspace, offset);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setSelected(null);
    setPending(null);
    setItems([]);
    setOffset(0);
  }, [workspace, user?.id]);
  useEffect(() => {
    if (user) void load();
    else if (ready) setBusy(false);
  }, [workspace, user?.id, ready, offset]);
  async function remove() {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.remove(workspace, pending);
      setPending(null);
      setSelected(null);
      if (items.length === 1 && offset > 0) setOffset(Math.max(0, offset - 20));
      else await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  const filtered = items.filter((r) =>
    `${r.filename} ${r.result.subject} ${r.result.possible_condition || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">YOUR OBSERVATIONS, ORGANIZED</span>
          <h1>{c.history}</h1>
          <p>
            Revisit your saved {c.subject} scans and the next steps that
            followed.
          </p>
        </div>
        <Link className="button small" to={`/${workspace}/scan`}>
          New Scan
          <ArrowRight size={16} />
        </Link>
      </div>
      {!ready ? (
        <Loading />
      ) : !user ? (
        <div className="panel empty-state">
          <History size={40} />
          <h2>A private place for your reports.</h2>
          <p>Sign in to see your saved {c.plural} observations.</p>
          <Link
            className="button"
            to={`/auth/login?next=/${workspace}/history`}
          >
            Sign In
            <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="panel history-panel">
            <div className="history-toolbar">
              <label className="search-field">
                <Search size={18} />
                <input
                  aria-label="Search reports on this page"
                  placeholder="Search reports on this page…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                className="icon-button"
                onClick={load}
                disabled={busy}
                aria-label="Refresh scan history"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            {error && <ErrorMessage message={error} />}{" "}
            {busy ? (
              <Loading text="Loading your reports…" />
            ) : items.length === 0 ? (
              <div className="empty-state">
                <FileText size={42} />
                <h2>Your next insight starts with a photo.</h2>
                <p>
                  No scans saved yet. Successful analyses appear here
                  automatically.
                  <br />
                  Unavailable or failed analyses never create a report.
                </p>
                <Link className="button" to={`/${workspace}/scan`}>
                  Start a Scan
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="history-list">
                  {filtered.map((r) => (
                    <div className="history-row" key={r.id}>
                      <span className="mini-icon">
                        <c.icon size={23} />
                      </span>
                      <button
                        className="report-open"
                        onClick={() => setSelected(r)}
                      >
                        <strong>{r.result.subject}</strong>
                        <span>
                          {r.filename} ·{" "}
                          {new Date(r.created_at).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </button>
                      <span className="report-condition">
                        {r.result.possible_condition || "Observations recorded"}
                      </span>
                      <button
                        className="text-link"
                        onClick={() => setSelected(r)}
                      >
                        View
                        <ArrowRight size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete report for ${r.filename}`}
                        onClick={() => setPending(r.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="empty-state">
                      No reports on this page match your search.
                    </p>
                  )}
                </div>
                <div className="pagination">
                  <button
                    className="button secondary small"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - 20))}
                  >
                    Previous
                  </button>
                  <span>
                    {offset + 1}–{Math.min(offset + 20, total)} of {total}
                  </span>
                  <button
                    className="button secondary small"
                    disabled={offset + 20 >= total}
                    onClick={() => setOffset(offset + 20)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
          {selected && (
            <div className="selected-report">
              <div className="section-heading">
                <h2>Saved report</h2>
                <button
                  className="icon-button"
                  aria-label="Close report"
                  onClick={() => setSelected(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <ReportPanel report={selected} />
            </div>
          )}
          {pending && (
            <div className="delete-confirm panel" role="alert">
              <div>
                <strong>Delete this report permanently?</strong>
                <p>This removes the report from your history.</p>
              </div>
              <button
                className="button secondary small"
                disabled={deleting}
                onClick={() => setPending(null)}
              >
                Keep Report
              </button>
              <button
                className="button small"
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? "Deleting…" : "Delete Report"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
