import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { Brand } from "../components/Brand";
import { Photo } from "../components/Photo";
import { ErrorMessage } from "../components/Status";
import { api } from "../services/api";
import { safeReturn } from "../services/workspaces";
import { useAuth } from "../hooks/AuthContext";
export default function AuthPage({ register = false }: { register?: boolean }) {
  const [params] = useSearchParams();
  const next = safeReturn(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = register
        ? await api.register(name, email, password)
        : await api.login(email, password);
      setUser(user);
      navigate(next, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Photo src="/images/farmer-hero.png" alt="Farmer caring for crops" />
        <div className="auth-overlay" />
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow">ROOTED IN POSSIBILITY</span>
          <h1>
            A healthier farm.
            <br />A brighter future.
          </h1>
          <p>
            Simple tools and thoughtful guidance.
            <br />
            For the work that matters to you.
          </p>
          <div className="hero-values">
            <span>Smarter farming</span>
            <span>Healthier livestock</span>
          </div>
        </div>
      </aside>
      <main className="auth-main" id="main">
        <Link className="text-link" to="/">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <div className="auth-form-wrap">
          <Brand />
          <span className="eyebrow">
            {register ? "LET’S GROW TOGETHER" : "GOOD TO HAVE YOU HERE"}
          </span>
          <h1>{register ? "Create your account" : "Welcome back."}</h1>
          <p>
            {register
              ? "Keep your farm’s observations and reports together."
              : "Sign in to continue caring for your farm."}
          </p>
          {next.startsWith("/agrivision") || next.startsWith("/pashuvision") ? (
            <div className="auth-workspace">
              Continuing to{" "}
              <strong>
                {next.startsWith("/agrivision") ? "AgriVision" : "PashuVision"}
              </strong>
            </div>
          ) : null}
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  required
                  placeholder={
                    register ? "At least 10 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {register && (
              <p className="form-hint">
                Use at least 10 characters. Your password is securely hashed.
              </p>
            )}
            {error && <ErrorMessage message={error} />}
            <button className="button full-width" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {register ? "Create Account" : "Sign In"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="auth-alternate">
            {register ? "Already have an account?" : "New to AgriBovix AI?"}{" "}
            <Link
              to={`/auth/${register ? "login" : "register"}?next=${encodeURIComponent(next)}`}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-legal">
            By continuing, you agree to our <Link to="/terms">Terms</Link> and{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <div className="auth-security">
            <LockKeyhole size={15} />
            Your workspace. Your private records.
          </div>
        </div>
      </main>
    </div>
  );
}
