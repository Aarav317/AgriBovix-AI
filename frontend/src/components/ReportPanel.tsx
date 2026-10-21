import { Download, ShieldCheck, ExternalLink } from "lucide-react";
import type { Report, Source } from "../types";
export function Sources({ sources }: { sources: Source[] }) {
  return (
    <div className="source-links">
      {sources
        .filter((s) => /^https?:\/\//.test(s.url))
        .map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
            {s.title}
            <ExternalLink size={13} />
          </a>
        ))}
    </div>
  );
}
export function ReportPanel({ report }: { report: Report }) {
  const r = report.result;
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agribovix-report-${report.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <article className="panel report-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">AI PREDICTION · REQUIRES REVIEW</span>
          <h2>{r.subject}</h2>
        </div>
        <button
          className="icon-button"
          onClick={download}
          aria-label="Download report"
        >
          <Download size={20} />
        </button>
      </div>
      <p>{r.possible_condition || "No specific condition identified."}</p>
      <div className="report-meta">
        <span>{r.model_name}</span>
        <span>
          {r.confidence === null
            ? "Confidence not provided"
            : `Model confidence: ${Math.round(r.confidence * 100)}%`}
        </span>
        <span>{r.urgency.replaceAll("_", " ")}</span>
      </div>
      {[
        ["Visible observations", r.observations],
        ["General care steps", r.care_steps],
        ["Preventive recommendations", r.prevention],
        ["Sourced treatment information", r.treatment_options],
        ["Uncertainty & limitations", r.limitations],
      ].map(
        ([title, items]) =>
          (items as string[]).length > 0 && (
            <section key={title as string}>
              <h3>{title as string}</h3>
              <ul>
                {(items as string[]).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </section>
          ),
      )}
      <Sources sources={r.sources} />
      <p className="notice">
        <ShieldCheck size={18} />
        This is an AI prediction, not a professional diagnosis. Source links
        provide context; they do not confirm the prediction. Consult a qualified{" "}
        {report.workspace === "agrivision"
          ? "agricultural expert"
          : "veterinarian"}{" "}
        before treatment.
      </p>
    </article>
  );
}
