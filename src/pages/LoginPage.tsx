import { useState, ChangeEvent, FormEvent, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5";

const PREVIEW_ROWS = [
  { label: "In-person visit", meta: "Due today", dot: "bg-amber-400" },
  { label: "Send outreach A2", meta: "Tomorrow", dot: "bg-sky-400" },
  { label: "Check-in: did they reply?", meta: "In 3 days", dot: "bg-green-primary" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    api
      .post("/api/auth/login", credentials)
      .then((res) => {
        const { user, access_token } = res.data;
        auth?.login(user, access_token);
        navigate("/dashboard");
      })
      .catch(() => {
        setError("Invalid email or password. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-white font-inter antialiased lg:grid lg:grid-cols-2">
      {/* ── Form side ─────────────────────────────────────────────────────── */}
      <div className="min-h-screen flex flex-col px-6 py-8 sm:px-10">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-gray-950 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-gray-950">
            Pitchr
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-gray-950">
              Welcome back
            </h1>
            <p className="text-[15px] text-gray-500 mt-2">
              Sign in to pick up where you left off.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  id="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-700 transition"
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 text-[13px] text-red-600 bg-red-50/70 border border-red-100 rounded-xl px-3.5 py-2.5"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gray-950 text-white text-[15px] font-medium shadow-[0_1px_2px_rgba(16,24,40,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {loading ? "Signing in" : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Intercon Visuals
        </p>
      </div>

      {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
      <div className="hidden lg:block p-3">
        <div className="relative h-full rounded-[28px] bg-gray-950 overflow-hidden flex flex-col justify-end p-12">
          {/* Glow + grid texture */}
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-green-primary/25 blur-[120px]" />
          <div className="absolute bottom-0 -left-32 w-[380px] h-[380px] rounded-full bg-sky-500/10 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)",
            }}
          />

          {/* Product preview */}
          <div className="relative mb-auto mt-16 ml-auto w-full max-w-[340px] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-white/90">
                Today's follow-ups
              </span>
              <span className="text-[11px] font-medium text-green-primary bg-green-primary/10 border border-green-primary/20 px-2 py-0.5 rounded-full">
                3 open
              </span>
            </div>
            <div className="space-y-2">
              {PREVIEW_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5"
                >
                  <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span className="text-[13px] text-white/80 flex-1">{row.label}</span>
                  <span className="text-[11px] text-white/40">{row.meta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="relative max-w-md">
            <h2 className="text-[34px] leading-[1.15] font-semibold tracking-[-0.02em] text-white">
              Every pitch, visit and follow-up in one place.
            </h2>
            <p className="text-[15px] text-white/50 mt-4 leading-relaxed">
              Pitchr keeps your outreach sequence moving so no lead goes cold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
