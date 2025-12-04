import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api/client";

type AuthResponse = {
  access_token: string;
  token_type: string;
};

export default function Login() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [role, setRole] = useState("University Student");
  const [region, setRegion] = useState("");
  const [university, setUniversity] = useState("");
  const [classId, setClassId] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup && !acceptedTerms) {
      setError("Please accept the terms of use.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";

      const payload = { email, password };

      const res = await apiFetch<AuthResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_email", email);

      navigate(from);
    } catch (err) {
      setError(
        isSignup
          ? "Signup failed. Maybe this email is already used."
          : "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 blur-3xl opacity-60 bg-[radial-gradient(circle_at_top,_#1dd3a760,_transparent_55%)]" />
      <div className="relative rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 px-10 py-10 text-slate-50">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
            <img src="/logo.jpg" alt="EduZen logo" className="w-14 h-14 rounded-full object-cover" />
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            Edu<span className="text-emerald-300">Zen</span>
          </div>
          <p className="text-[11px] text-slate-300">Mindful study and wellness companion</p>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">
          {isSignup ? "Join Us Today" : "Welcome Back"}
        </h1>
        <p className="text-sm text-slate-300 text-center mb-6">
          {isSignup
            ? "Start tracking your mood, study habits, and wellbeing."
            : "Sign in to continue your conversations and statistics."}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Username"
                  icon="user"
                  value={username}
                  onChange={setUsername}
                  placeholder="Username"
                />
                <Field
                  label="First Name"
                  icon="user"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="First Name"
                />
                <Field
                  label="Last Name"
                  icon="user"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Last Name"
                />
                <SelectField
                  label="Role"
                  icon="role"
                  value={role}
                  onChange={setRole}
                  options={["University Student", "High School", "Graduate", "Other"]}
                />
                <Field
                  label="Email"
                  icon="mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="demo@example.com"
                  type="email"
                />
                <Field
                  label="Password"
                  icon="lock"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                />
                <Field
                  label="Telephone"
                  icon="phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+213 555 555 555"
                />
                <Field
                  label="Birthdate"
                  icon="calendar"
                  value={birthdate}
                  onChange={setBirthdate}
                  placeholder="yyyy-mm-dd"
                  type="date"
                />
                <SelectField
                  label="Region"
                  icon="globe"
                  value={region}
                  onChange={setRegion}
                  options={["", "Africa", "Europe", "Asia", "Americas", "Oceania"]}
                />
                <Field
                  label="University Name"
                  icon="building"
                  value={university}
                  onChange={setUniversity}
                  placeholder="University name"
                />
                <Field
                  label="Class ID"
                  icon="building"
                  value={classId}
                  onChange={setClassId}
                  placeholder="Class identifier"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-200 mt-2 select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded border border-white/20 bg-white/5"
                />
                <span>
                  I accept the{" "}
                  <span className="text-emerald-200 underline underline-offset-2 cursor-pointer">Terms of Use</span>
                </span>
              </label>
            </>
          ) : (
            <>
              <Field
                label="Email"
                icon="mail"
                value={email}
                onChange={setEmail}
                placeholder="demo@example.com"
                type="email"
              />
              <Field
                label="Password"
                icon="lock"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </>
          )}

          {error && <p className="text-xs text-red-300 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-300 hover:via-emerald-500 hover:to-indigo-500 transition disabled:opacity-60"
          >
            {loading
              ? isSignup
                ? "Creating account..."
                : "Signing in..."
              : isSignup
              ? "Sign up"
              : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-xs text-center text-slate-300">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-emerald-200 hover:text-emerald-100 underline"
                onClick={() => setIsSignup(false)}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-emerald-200 hover:text-emerald-100 underline"
                onClick={() => setIsSignup(true)}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  icon: "user" | "mail" | "lock" | "phone" | "calendar" | "globe" | "building" | "role";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
};

function Field({ label, icon, value, onChange, placeholder, type = "text", autoComplete }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.08em] text-slate-300">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-400/40 transition">
        <Icon name={icon} />
        <input
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  icon: "role" | "globe" | "building";
  value: string;
  onChange: (v: string) => void;
  options: string[];
};

function SelectField({ label, icon, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.08em] text-slate-300">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-400/40 transition">
        <Icon name={icon} />
        <select
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt || "empty"} value={opt} className="bg-slate-900 text-white">
              {opt || "Select"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Icon({ name }: { name: FieldProps["icon"] }) {
  if (name === "user") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M6 19c0-2.8 3.1-4.5 6-4.5s6 1.7 6 4.5" />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }
  if (name === "lock") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 3h2A2.5 2.5 0 0 1 11 5.5v2a2.5 2.5 0 0 1-2.5 2.5H8a8 8 0 0 0 8 8v-.5A2.5 2.5 0 0 1 18.5 15h2A2.5 2.5 0 0 1 23 17.5v2A2.5 2.5 0 0 1 20.5 22H19A15 15 0 0 1 2 5V3.5A2.5 2.5 0 0 1 4.5 1h2Z" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M9 14h6" />
      </svg>
    );
  }
  if (name === "globe") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14.5 14.5 0 0 1 0 18" />
        <path d="M12 3a14.5 14.5 0 0 0 0 18" />
      </svg>
    );
  }
  if (name === "building") {
    return (
      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    );
  }
  // role icon fallback
  return (
    <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}
