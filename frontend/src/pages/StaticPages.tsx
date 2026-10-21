import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Brand } from "../components/Brand";
import { WorkspaceCards } from "./HomePage";
export function ChooseWorkspace() {
  return (
    <div className="choose-page">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <Link className="text-link" to="/">
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>
      </header>
      <main className="container" id="main">
        <span className="eyebrow">WELCOME TO AGRIBOVIX AI</span>
        <h1>What are we caring for today?</h1>
        <p>Choose a workspace. Each has its own tools, guide, and history.</p>
        <WorkspaceCards />
      </main>
    </div>
  );
}
export function PolicyPage({ privacy = false }: { privacy?: boolean }) {
  return (
    <main className="policy-page container" id="main">
      <Brand />
      <Link className="text-link back-link" to="/">
        <ArrowLeft size={16} />
        Home
      </Link>
      <span className="eyebrow">PROJECT INFORMATION · 20 OCTOBER 2026</span>
      <h1>{privacy ? "Privacy Policy" : "Terms of Service"}</h1>
      {privacy ? (
        <>
          <h2>What is stored</h2>
          <p>
            This local application stores your name, email, salted password
            hash, session tokens as hashes, and successful analysis reports in a
            SQLite database on the host computer. Raw passwords and uploaded
            photographs are not stored in that database.
          </p>
          <h2>What happens to photos and messages</h2>
          <p>
            Your image is validated and re-encoded on the backend. When a model
            adapter is configured, the processed image is sent to that service.
            Assistant messages are sent to the configured assistant service. The
            provider may have its own retention policy; the operator must
            disclose it before collecting real user data. Chats are held in
            browser memory for this visit and are not saved by this app.
          </p>
          <h2>Cookies and records</h2>
          <p>
            An HttpOnly, SameSite session cookie keeps you signed in for up to
            seven days. Sign out to invalidate that session. You can delete
            individual scan reports from history. There are no analytics or
            advertising trackers in this project. Contact and self-service
            account deletion are not configured; the local operator must handle
            account removal.
          </p>
          <h2>Deployment and contact</h2>
          <p>
            This is a local prototype policy. Before public use, the operator
            must add their identity, contact information, retention rules,
            provider details, and applicable privacy disclosures.
          </p>
        </>
      ) : (
        <>
          <h2>Purpose</h2>
          <p>
            AgriBovix AI provides educational crop and livestock assistance. AI
            findings are predictions with limitations. They do not establish a
            diagnosis or replace an agricultural expert or veterinarian.
          </p>
          <h2>Care decisions</h2>
          <p>
            Seek professional help for serious or uncertain concerns. Do not
            prescribe livestock medicines or choose pesticide treatments solely
            from an image. Follow local requirements and product labels where
            relevant.
          </p>
          <h2>Model availability</h2>
          <p>
            Analysis and assistant responses require separately configured
            services. Without them, those features are unavailable. No accuracy,
            yield improvement, breed identification capability, or clinical
            validity is guaranteed.
          </p>
          <h2>Your use</h2>
          <p>
            Upload only images you have permission to use. Keep account
            credentials private. Before public deployment, the operator must
            review these prototype terms and add their legal identity and
            contact details.
          </p>
        </>
      )}
      <Link className="button" to="/">
        Back to Home
      </Link>
    </main>
  );
}
export function NotFound() {
  return (
    <main className="not-found" id="main">
      <Brand />
      <span className="eyebrow">404 · A PATH LESS TRAVELLED</span>
      <h1>This page hasn’t grown here.</h1>
      <p>Let’s get you back to your farm.</p>
      <Link className="button" to="/">
        Back to Home
      </Link>
    </main>
  );
}
