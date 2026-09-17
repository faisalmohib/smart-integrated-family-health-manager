import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import { Stethoscope, UserPlus, User, Mail, Lock } from "lucide-react";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signup(form);
      navigate("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8 text-gray-100"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, #175453 0%, #152c33 45%, #10191e 85%, #0b1114 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#21292d]/80 p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-700/80 bg-[#161d20]">
              <Stethoscope className="h-8 w-8 text-[#00a884]" />
            </div>

            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[#00a884]">
                SIFHM
              </span>
            </div>

            <h1 className="text-3xl font-normal tracking-wide text-gray-100">
              Create Account
            </h1>

            <p className="mt-2 text-sm font-light text-gray-400">
              Join Smart Integrated Family Health Manager
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-800/50 bg-red-950/40 p-4 text-center text-xs font-light text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#00a884]">
                Full Name
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="h-4 w-4" />
                </div>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="w-full rounded-xl border border-gray-700/60 bg-[#161d20] py-3 pl-10 pr-4 text-sm font-light text-gray-100 placeholder-gray-500 transition focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#00a884]">
                Email
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-gray-700/60 bg-[#161d20] py-3 pl-10 pr-4 text-sm font-light text-gray-100 placeholder-gray-500 transition focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#00a884]">
                Password
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  maxLength={72}
                  className="w-full rounded-xl border border-gray-700/60 bg-[#161d20] py-3 pl-10 pr-4 text-sm font-light text-gray-100 placeholder-gray-500 transition focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] py-3 text-sm font-medium text-white transition hover:bg-[#008f70] disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-center text-xs font-light text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[#00a884] transition hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;