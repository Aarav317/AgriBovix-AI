import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Leaf,
  Sprout,
  ScanLine,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Upload,
  Search,
  ClipboardCheck,
  Check,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { CowIcon as Beef } from "../components/CowIcon";
import { Brand } from "../components/Brand";
import { Photo } from "../components/Photo";
export function WorkspaceCards() {
  return (
    <div className="workspace-cards">
      {[
        {
          id: "agrivision",
          title: "AgriVision",
          subtitle: "Healthy Crops, Higher Yields",
          description:
            "Understand crop health, explore visible concerns, and find practical guidance for your next harvest.",
          image: "/images/crop-leaves.png",
          icon: Sprout,
        },
        {
          id: "pashuvision",
          title: "PashuVision",
          subtitle: "Healthy Animals, Stronger Farms",
          description:
            "Explore livestock identification, keep useful health records, and discover better everyday care.",
          image: "/images/cattle.png",
          icon: Beef,
        },
      ].map((c) => (
        <article className="workspace-card" key={c.id}>
          <div className="workspace-copy">
            <div className="workspace-card-title">
              <span className="circle-icon dark">
                <c.icon size={27} />
              </span>
              <div>
                <h2>{c.title}</h2>
                <p className="workspace-subtitle">{c.subtitle}</p>
              </div>
            </div>
            <p>{c.description}</p>
            <Link className="button small" to={`/${c.id}`}>
              Explore {c.title}
              <ArrowRight size={16} />
            </Link>
          </div>
          <Photo
            src={c.image}
            alt={
              c.id === "agrivision"
                ? "Healthy green leaves in natural light"
                : "Brown cow in a green pasture"
            }
            className="workspace-photo"
          />
        </article>
      ))}
    </div>
  );
}
export default function HomePage() {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            className={menu ? "home-nav open" : "home-nav"}
            aria-label="Main navigation"
          >
            {[
              ["Home", "/"],
              ["About", "/#about"],
              ["Features", "/#features"],
              ["How It Works", "/#how-it-works"],
              ["Contact", "/#contact"],
            ].map(([label, url]) => (
              <a
                className={label === "Home" ? "active" : ""}
                href={url}
                key={label}
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <Link to="/auth/login" className="button small header-login">
            <span className="user-dot" />
            Login
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <Photo
            src="/images/farmer-hero.png"
            alt="Farmer inspecting a green leaf with a smartphone in a field"
            className="hero-image"
          />
          <div className="hero-shade" />
          <div className="container hero-content">
            <div className="hero-copy">
              <span className="hero-pill">
                <Leaf size={14} />
                ROOTED IN FARMING. POWERED BY POSSIBILITY.
              </span>
              <h1>
                Smarter farming.
                <br />
                Healthier livestock.
                <br />
                <span>A better tomorrow.</span>
              </h1>
              <p>
                AI-powered solutions for modern agriculture.
                <br />
                Crop insights, livestock care, and practical guidance —
                <br className="desktop-break" /> together in one place.
              </p>
              <div className="hero-buttons">
                <a href="#workspaces" className="button light">
                  Get Started
                  <ArrowRight size={18} />
                </a>
                <a href="#how-it-works" className="button outline-light">
                  <span className="play-icon">
                    <Play size={12} />
                  </span>
                  See How It Works
                </a>
              </div>
              <div className="hero-values">
                <span>
                  <ScanLine size={16} />
                  AI-assisted insights
                </span>
                <span>
                  <ShieldCheck size={16} />
                  Farmer-first guidance
                </span>
                <span>
                  <Sprout size={16} />
                  Built for better care
                </span>
              </div>
            </div>
          </div>
          <div className="hero-caption">
            <span className="caption-icon">
              <Leaf size={22} />
            </span>
            <div>
              <strong>From your field. To your next step.</strong>
              <small>A little clarity can make a big difference.</small>
            </div>
          </div>
        </section>
        <section className="workspace-section container" id="workspaces">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ONE PLATFORM. TWO PURPOSES.</span>
              <h2>The right support for your farm.</h2>
            </div>
            <p>Choose your workspace to get started.</p>
          </div>
          <WorkspaceCards />
        </section>
        <section className="benefits-section" id="features">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THOUGHTFULLY BUILT FOR YOU</span>
                <h2>Why choose AgriBovix AI?</h2>
              </div>
              <p>Simple. Useful. Made for everyday farming.</p>
            </div>
            <div className="benefits-grid">
              {[
                {
                  icon: ScanLine,
                  title: "AI-assisted analysis",
                  text: "A clearer look at supported visual features.",
                },
                {
                  icon: Smartphone,
                  title: "Easy to use",
                  text: "A simple path from photo to next steps.",
                },
                {
                  icon: ShieldCheck,
                  title: "Reliable information",
                  text: "Clear sources, uncertainty, and limitations.",
                },
                {
                  icon: TrendingUp,
                  title: "Better productivity",
                  text: "Support for more informed farm decisions.",
                },
              ].map((b) => (
                <div className="benefit" key={b.title}>
                  <span className="circle-icon">
                    <b.icon size={23} />
                  </span>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="how-section container" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE CLARITY, STEP BY STEP</span>
              <h2>From a photo to a plan.</h2>
            </div>
            <a className="text-link" href="#workspaces">
              Let’s get started
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Upload,
                title: "Upload a photo",
                text: "Choose a clear image of your plant or animal.",
              },
              {
                icon: Search,
                title: "Explore with AI",
                text: "A connected model reviews supported features.",
              },
              {
                icon: ClipboardCheck,
                title: "Review the findings",
                text: "Read observations, uncertainty, and sources.",
              },
              {
                icon: Check,
                title: "Take the next step",
                text: "Follow appropriate care or ask a qualified expert.",
              },
            ].map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-number">0{i + 1}</span>
                <s.icon size={27} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {i < 3 && <ChevronRight className="step-chevron" size={20} />}
              </div>
            ))}
          </div>
        </section>
        <section className="about-section container" id="about">
          <div>
            <span className="eyebrow">GROWING A BETTER TOMORROW</span>
            <h2>
              Technology with its roots
              <br />
              in the real world.
            </h2>
          </div>
          <div>
            <p>
              Every field and every animal has a story. AgriBovix AI helps you
              understand what you can see, keep better records, and know when to
              reach out for expert support.
            </p>
            <p className="muted">
              A first-assistance platform for farmers. Built to support
              agricultural experts and veterinarians in the care of your farm.
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer" id="contact">
        <div className="container">
          <div className="footer-main">
            <div>
              <Brand />
              <p>
                Smarter Farming. Healthier Livestock.
                <br />
                Better Tomorrow.
              </p>
            </div>
            <div>
              <h3>Explore</h3>
              <Link to="/agrivision">AgriVision</Link>
              <Link to="/pashuvision">PashuVision</Link>
              <a href="/#how-it-works">How it works</a>
            </div>
            <div>
              <h3>Get in touch</h3>
              <p>
                Contact details coming soon.
                <br />
                Project contact has not been configured.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} AgriBovix AI</span>
            <p>Educational assistance. AI findings require expert review.</p>
            <div>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
