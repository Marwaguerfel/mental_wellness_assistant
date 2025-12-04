import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import Games from "./pages/Games";
import Profile from "./pages/Profile";
import DashboardHome from "./pages/DashboardHome";
import Placeholder from "./pages/Placeholder";
import AppShell from "./layouts/AppShell";
import RequireAuth from "./components/RequireAuth";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const email = localStorage.getItem("user_email");
  const appShellPaths = new Set([
    "/",
    "/chat",
    "/exercises",
    "/games",
    "/me",
    "/statistics",
    "/dashboard",
    "/add_task",
    "/calendar",
    "/list_tasks",
    "/mental_wellness",
  ]);
  const isAppShellPage = appShellPaths.has(location.pathname);
  const isLoginPage = location.pathname === "/login";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1 rounded text-sm ${isActive ? "bg-emerald-100 text-emerald-700" : "text-slate-700"}`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  const wrapperClass = isAppShellPage
    ? ""
    : isLoginPage
    ? "min-h-screen bg-gradient-to-br from-[#0b1c2e] via-[#0f3a40] to-[#0b2b24] text-slate-100 flex items-center justify-center"
    : "min-h-screen bg-slate-50 text-slate-900";

  const mainClass = isAppShellPage
    ? ""
    : isLoginPage
    ? "w-full flex justify-center px-4 py-8"
    : "max-w-5xl mx-auto px-4 pb-8";

  return (
    <div className={wrapperClass}>
      {!isAppShellPage && !isLoginPage && (
        <header className="bg-white shadow mb-4">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-bold text-lg"
            >
              <img src="/eduzen-logo.jpg" alt="EduZen" className="h-8 w-auto" />
            </button>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {!token && (
                  <NavLink to="/login" className={navLinkClass}>
                    Login
                  </NavLink>
                )}
                <NavLink to="/" className={navLinkClass}>
                  Home
                </NavLink>
                <NavLink to="/chat" className={navLinkClass}>
                  Chat
                </NavLink>
                <NavLink to="/statistics" className={navLinkClass}>
                  Statistics
                </NavLink>
                <NavLink to="/exercises" className={navLinkClass}>
                  Exercises
                </NavLink>
                <NavLink to="/games" className={navLinkClass}>
                  Games
                </NavLink>
                <NavLink to="/me" className={navLinkClass}>
                  Profile
                </NavLink>
              </div>

              {token && (
                <div className="flex items-center gap-2 text-xs">
                  {email && <span className="text-slate-500 max-w-[140px] truncate">{email}</span>}
                  <button
                    onClick={handleLogout}
                    className="border border-emerald-500 text-emerald-600 px-2 py-1 rounded text-xs hover:bg-emerald-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>
      )}

      <main className={mainClass}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardHome />
              </RequireAuth>
            }
          />
          <Route
            path="/add_task"
            element={
              <RequireAuth>
                <Placeholder title="Add Task" description="Task creation is coming soon." />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth>
                <Placeholder title="Calendar" description="View and sync events soon." />
              </RequireAuth>
            }
          />
          <Route
            path="/list_tasks"
            element={
              <RequireAuth>
                <Placeholder title="Task List" description="Your task list will live here." />
              </RequireAuth>
            }
          />
          <Route
            path="/mental_wellness"
            element={
              <RequireAuth>
                <AppShell>
                  <Chat />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/statistics"
            element={
              <RequireAuth>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />

          <Route
            path="/chat"
            element={
              <RequireAuth>
                <AppShell>
                  <Chat />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Navigate to="/statistics" replace />
              </RequireAuth>
            }
          />
          <Route
            path="/exercises"
            element={
              <RequireAuth>
                <AppShell>
                  <Exercises />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/games"
            element={
              <RequireAuth>
                <AppShell>
                  <Games />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/me"
            element={
              <RequireAuth>
                <AppShell>
                  <Profile />
                </AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
