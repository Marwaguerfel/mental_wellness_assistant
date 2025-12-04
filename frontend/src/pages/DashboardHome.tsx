import { useEffect, useMemo, useState, type ReactNode } from "react";
import AppShell from "../layouts/AppShell";

type Task = {
  id: string;
  title: string;
  time?: string;
  status?: "new" | "done" | "pending";
};

export default function DashboardHome() {
  const [now, setNow] = useState(new Date());
  const name = useMemo(() => (localStorage.getItem("user_name") || "Learner").toUpperCase(), []);
  const [avatarData, setAvatarData] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("profile_avatar");
    if (stored) setAvatarData(stored);
  }, []);

  const tasks: Task[] = [
    { id: "1", title: "School Plan", status: "new" },
    { id: "2", title: "Finish reading chapter 3", status: "pending" },
  ];

  const upcoming: Task[] = [{ id: "u1", title: "Midterm prep", time: "02/06/2025" }];
  const exams: Task[] = [];
  const projects: Task[] = [];

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const TaskRow = ({ task }: { task: Task }) => (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[#20ad96] text-sm">•</span>
        <div>
          <p className="text-sm text-slate-800">{task.title}</p>
          {task.time && <p className="text-[11px] text-slate-400">{task.time}</p>}
        </div>
      </div>
      {task.status === "new" && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          New
        </span>
      )}
      {task.status === "pending" && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
          Pending
        </span>
      )}
      {task.status === "done" && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Done
        </span>
      )}
    </div>
  );

  const InfoCard = ({ title, items, icon }: { title: string; items: Task[]; icon: ReactNode }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="text-[#20ad96]">{icon}</span>
        <span>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">No upcoming items</p>
      ) : (
        items.map((t) => (
          <div key={t.id} className="bg-white border border-slate-100 rounded-xl shadow-sm p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#20ad96]">1</span>
              <div>
                <p className="text-sm text-slate-800">{t.title}</p>
                {t.time && <p className="text-[11px] text-slate-400">{t.time}</p>}
              </div>
            </div>
            {t.time && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {t.time}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
          <div className="bg-[#f7f1ea] border border-[#e6d7c9] rounded-[26px] shadow-md px-8 py-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-xl font-semibold text-[#1f2937]">{formatTime(now)}</p>
                <p className="text-xs text-slate-500">{todayLabel}</p>
              </div>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center border border-slate-100"
                title="Profile"
              >
                {avatarData ? (
                  <img
                    src={avatarData}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-white"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20ad96] to-[#3a98f5] text-white flex items-center justify-center font-semibold text-sm">
                    {name.charAt(0)}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-[#2c2d5b]">Good Morning, {name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-slate-600">Today:</span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {tasks.length} tasks
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#2c2d5b]">
                <span className="text-[#20ad96]">▲</span>
                <span className="font-semibold">Actual Tasks</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#20ad96] text-white text-sm shadow">
                  <span>+</span>
                  <span>Add Task</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-[#20ad96]">
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <InfoCard
            title="Upcoming Tasks (Next 7 days)"
            items={upcoming}
            icon={<span className="text-[#20ad96]">≡</span>}
          />
          <InfoCard
            title="Exams (Next 7 days)"
            items={exams}
            icon={<span className="text-[#8b5cf6]">▢</span>}
          />
          <InfoCard
            title="Projects (Next 7 days)"
            items={projects}
            icon={<span className="text-[#20ad96]">✦</span>}
          />
        </div>
      </div>
    </AppShell>
  );
}
