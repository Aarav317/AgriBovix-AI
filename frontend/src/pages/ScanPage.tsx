import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { Camera, ArrowLeft, ShieldCheck } from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import { workspaceConfig } from "../services/workspaces";
import { UploadPanel } from "../components/UploadPanel";
import { ModelNotice } from "./DashboardPage";
export default function ScanPage() {
  const { workspace } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const [params] = useSearchParams();
  const task = c.actions.find((a) => a.task === params.get("task"));
  return (
    <>
      <Link className="text-link back-link" to={`/${workspace}`}>
        <ArrowLeft size={15} />
        Dashboard
      </Link>
      <div className="page-intro">
        <div>
          <span className="eyebrow">A CLEARER PICTURE STARTS HERE</span>
          <h1>{task?.title || `Scan your ${c.subject}`}</h1>
          <p>{c.photoTip}</p>
        </div>
      </div>
      <ModelNotice />
      <div className="scan-page-grid">
        <div>
          <UploadPanel workspace={workspace} />
        </div>
        <aside className="panel scan-tips">
          <Camera size={29} />
          <h2>A better photo helps.</h2>
          <ul>
            <li>Use natural light and keep the camera steady.</li>
            <li>Keep one subject clearly in focus.</li>
            <li>Avoid filters, text overlays, and screenshots.</li>
            <li>
              {workspace === "agrivision"
                ? "Show the affected area and a healthy area for context."
                : "Keep a safe distance and avoid disturbing the animal."}
            </li>
          </ul>
          <div className="notice">
            <ShieldCheck size={18} />
            <p>
              {workspace === "agrivision"
                ? "An image may not reveal the cause. Do not choose chemicals solely from an AI prediction."
                : "An image cannot confirm internal illness or justify medication. Contact a veterinarian if the animal is unwell."}
            </p>
          </div>
          <Link className="text-link" to={`/${workspace}/guide`}>
            Read the {c.guide.toLowerCase()}
          </Link>
        </aside>
      </div>
    </>
  );
}
