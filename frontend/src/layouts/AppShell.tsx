import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

type Props = { children: ReactNode };

export default function AppShell({ children }: Props) {
  const navigate = useNavigate();

  const base = "flex items-center gap-2 px-3 py-2 rounded-xl text-sm capitalize transition";
  const active = "bg-white text-[#3f3a64] shadow-sm border border-[#20ad96]/40";
  const inactive = "text-[#555] hover:bg-white hover:text-[#3f3a64]";

  const icons = {
    statistics: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5h16" />
        <path d="M6 19.5v-6.5" />
        <path d="M12 19.5v-9.5" />
        <path d="M18 19.5v-12.5" />
      </svg>
    ),
    chat: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H6A1.5 1.5 0 0 1 4.5 15V8A1.5 1.5 0 0 1 6 6.5Z" />
      </svg>
    ),
    exercises: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6.5" y="5" width="11" height="15" rx="2" />
        <path d="M9.5 3.5h5" />
        <path d="M9 11h6" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    games: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 5.5 1.6 3.2 3.4.5-2.5 2.5.6 3.4L12 13.8 8.9 15l.6-3.4-2.5-2.5 3.4-.5Z" />
      </svg>
    ),
    profile: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="9" r="3.5" />
        <path d="M6 19c0-2.8 3.1-4.5 6-4.5s6 1.7 6 4.5" />
      </svg>
    ),
    logout: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 12h9" />
        <path d="m13 8 4 4-4 4" />
        <path d="M8 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f5f1ed] flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-white to-[#f4f6fb] border-r border-slate-200 px-4 py-5 flex flex-col">
        {/* logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-6 cursor-pointer"
        >
          <img
            src="/logo.jpg"
            alt="EduZen logo"
            className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
          />
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-semibold text-[#3f3a64]">EduZen</span>
            <span className="text-[10px] text-slate-400">Study & Wellness</span>
          </div>
        </button>


        {/* menu */}
        <nav className="flex-1 space-y-2 text-sm">
          <NavLink to="/statistics" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
            <span className="shrink-0">{icons.statistics}</span>
            <span>statistics</span>
          </NavLink>

          <NavLink to="/chat" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
            <span className="shrink-0">{icons.chat}</span>
            <span>chat</span>
          </NavLink>

          <NavLink to="/exercises" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
            <span className="shrink-0">{icons.exercises}</span>
            <span>exercises</span>
          </NavLink>

          <NavLink to="/games" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
            <span className="shrink-0">{icons.games}</span>
            <span>games</span>
          </NavLink>

          <NavLink to="/me" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
            <span className="shrink-0">{icons.profile}</span>
            <span>profile</span>
          </NavLink>
        </nav>

        {/* logout button */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_email");
            navigate("/login");
          }}
          className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#20ad96] to-[#3a3e7b]"
        >
          <span className="shrink-0">{icons.logout}</span>
          <span>logout</span>
        </button>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 px-10 py-8 overflow-y-auto">{children}</main>
    </div>
  );
}
