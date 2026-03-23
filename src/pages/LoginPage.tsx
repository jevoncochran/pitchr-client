import { useState, ChangeEvent, FormEvent, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    axios
      .post("http://localhost:3000/api/auth/login", credentials)
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">

      {/* Logo / wordmark */}
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold text-charcoal tracking-tight">Pitchr</p>
        <p className="text-sm text-gray-400 mt-1">Sales CRM for Intercon Visuals</p>
      </div>

      {/* Card */}
      <div className="bg-white border rounded-2xl shadow-sm w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              id="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              id="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20 focus:border-charcoal transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-white py-2.5 rounded-lg text-sm font-medium hover:bg-charcoal/90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
