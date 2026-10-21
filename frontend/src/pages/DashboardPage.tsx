import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  Info,
  Camera,
  ScanLine,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
import { Photo } from "../components/Photo";
import { UploadPanel } from "../components/UploadPanel";
export function ModelNotice() {
  const { workspace, health, healthError } =
    useOutletContext<WorkspaceContext>();
  if (health?.workspaces[workspace].analysis_configured) return null;
  return (
    <div className="model-notice">
      <Info size={19} />
      <p>
        <strong>
          {healthError
            ? "The analysis service is offline."
            : "AI image analysis is currently unavailable."}
        </strong>{" "}
        {healthError
          ? "Please check the backend connection."
          : "You can preview photos and explore the guide. No diagnosis will be generated until a model is connected."}
      </p>
    </div>
  );
}
export default function DashboardPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user } = useAuth();
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">YOUR FARM. YOUR WORKSPACE.</span>
          <h1>
            Welcome to {c.name}
            <span className="heading-dot">.</span>
          </h1>
          <p>{c.description}</p>
        </div>
        <span className="intro-icon">
          <c.icon size={37} strokeWidth={1.3} />
        </span>
      </div>
      <div className="welcome-banner">
        <span className="circle-icon">
          <c.icon size={25} />
        </span>
        <div>
          <strong>{c.welcome}</strong>
          <p>
            Start with a clear photo. Build a better picture of your {c.plural}.
          </p>
        </div>
        <Photo
          src={c.image}
          alt={
            workspace === "agrivision"
              ? "Healthy green plant"
              : "Cow in a green pasture"
          }
        />
      </div>
      <div className="dashboard-grid">
        <div className="scan-column">
          <UploadPanel workspace={workspace} />
        </div>
        <aside className="instructions panel">
          <span className="eyebrow">A SIMPLE PLACE TO START</span>
          <h2>How to get a useful scan</h2>
          {[
            { icon: Camera, title: "Take a clear photo", text: c.photoTip },
            {
              icon: ScanLine,
              title: "Review supported features",
              text: "A configured model analyzes the image. Results depend on its supported subjects.",
            },
            {
              icon: ClipboardCheck,
              title: "Understand your next step",
              text: "Review findings and limitations. Ask an expert before making treatment decisions.",
            },
          ].map((item, i) => (
            <div className="instruction" key={item.title}>
              <span>{i + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
          <div className="instruction-footer">
            <ShieldCheck size={20} />
            <p>
              Better decisions start with
              <br />
              the right information.
            </p>
          </div>
        </aside>
      </div>
      <ModelNotice />
      <section className="quick-section">
        <div className="section-heading">
          <h2>What would you like to do?</h2>
          <span className="muted">A little support at every step</span>
        </div>
        <div className="quick-grid">
          {c.actions.map((a) => (
            <Link
              className="quick-card"
              key={a.title}
              to={`/${workspace}/${a.task === "guide" ? "guide" : a.task === "assistant" ? "assistant" : `scan?task=${a.task}`}`}
            >
              <span className="mini-icon">
                <a.icon size={23} />
              </span>
              <ArrowRight className="quick-arrow" size={16} />
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-bottom">
        <div className="history-prompt">
          <span className="mini-icon">
            <ClipboardCheck size={24} />
          </span>
          <div>
            <h3>Your observations, in one place.</h3>
            <p>
              {user
                ? "Open your saved reports and revisit earlier findings."
                : "Create an account to keep your future scan reports private and organized."}
            </p>
          </div>
          <Link
            className="text-link"
            to={
              user
                ? `/${workspace}/history`
                : `/auth/register?next=/${workspace}`
            }
          >
            {user ? "View history" : "Create account"}
            <ArrowRight size={16} />
          </Link>
        </div>
        <Link className="guide-prompt" to={`/${workspace}/guide`}>
          <BookOpen size={25} />
          <div>
            <strong>A little knowledge goes a long way.</strong>
            <span>
              Explore the {c.guide.toLowerCase()}
              <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>
    </>
  );
}
