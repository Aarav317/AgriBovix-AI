import { useOutletContext } from "react-router-dom";
import { ShieldCheck, PhoneCall } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { Sources } from "../components/ReportPanel";
export default function GuidePage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            GOOD CARE STARTS WITH GOOD INFORMATION
          </span>
          <h1>{c.guide}</h1>
          <p>
            General educational information, separate from any AI prediction.
          </p>
        </div>
        <span className="intro-icon">
          <ShieldCheck size={35} />
        </span>
      </div>
      <div className="guide-grid">
        {c.guideCards.map((card) => (
          <article className="panel guide-card" key={card.title}>
            <span className="circle-icon">
              <card.icon size={25} />
            </span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
      {workspace === "pashuvision" && (
        <section className="expert-callout">
          <PhoneCall size={25} />
          <div>
            <h2>Know when to call your veterinarian.</h2>
            <p>
              Breathing difficulty or rapid swelling of the left abdomen can
              require urgent veterinary attention. If an animal is severely
              unwell, seek help promptly and avoid giving medicines based on a
              photo.
            </p>
          </div>
        </section>
      )}
      <section className="panel sources-panel">
        <span className="eyebrow">READ FROM THE SOURCE</span>
        <h2>Trusted starting points</h2>
        <p>
          Use these educational references with local professional advice. They
          do not validate a particular scan or replace a diagnosis.
        </p>
        <Sources sources={c.sources} />
        <small>Sources reviewed for this project: 20 October 2026.</small>
      </section>
      <p className="notice">
        <ShieldCheck size={18} />
        {workspace === "agrivision"
          ? "Treatment depends on the confirmed cause, crop, local registration, and product label. No pesticide recommendation is generated without supporting evidence."
          : "Vaccination schedules, medicine choices and dosages must be determined with a qualified local veterinarian."}
      </p>
    </>
  );
}
