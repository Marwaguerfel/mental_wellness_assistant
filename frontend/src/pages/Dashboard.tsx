import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import FaceEmotionWidget from "../components/FaceEmotionWidget";
import { EmotionBot, type BotMood } from "../components/EmotionBot";
import { moodFromSignals } from "../utils/botMood";

type DaySummary = {
  date: string;
  avg_sentiment: number;
  avg_stress: number;
};

type DashboardSummary = {
  user_id: string;
  days: DaySummary[];
  high_stress_days: number;
};

type GameSuggestion = {
  suggested_game: "focus" | "memory" | "relax";
  reason: string;
  stress_score: number | null;
  risk_flag: boolean;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinStatus, setCheckinStatus] = useState<string | null>(null);
  const [gameSuggestion, setGameSuggestion] = useState<GameSuggestion | null>(null);
  const [loadingGameSuggestion, setLoadingGameSuggestion] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<DashboardSummary>("/api/dashboard/summary/me");
        setData(res);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not load statistics");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        const res = await apiFetch<GameSuggestion>("/api/games/recommend");
        setGameSuggestion(res);
      } catch (err) {
        console.error("Could not load game suggestion", err);
      } finally {
        setLoadingGameSuggestion(false);
      }
    };

    loadSuggestion();
  }, []);

  const latestDay = data?.days?.[data.days.length - 1];

  const sentimentLabel = (score: number) => {
    if (score <= -0.75) return "Very negative";
    if (score < 0) return "Negative";
    if (score === 0) return "Neutral";
    if (score < 0.75) return "Positive";
    return "Very positive";
  };

  const stressLabel = (score: number) => {
    if (score < 0.3) return "Low";
    if (score < 0.7) return "Moderate";
    return "High";
  };

  const sendCheckin = async (mood: string) => {
    try {
      await apiFetch(`/api/dashboard/checkin?mood=${mood}`, { method: "POST" });
      setCheckinStatus("Check-in saved: " + mood.replace("_", " "));
      setTimeout(() => setCheckinStatus(null), 1500);
      setLoading(true);
      const res = await apiFetch<DashboardSummary>("/api/dashboard/summary/me");
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setCheckinStatus("Error saving check-in");
    }
  };

  const chartData =
    data?.days.map((d) => ({
      date: d.date,
      stress: d.avg_stress,
      sentiment: d.avg_sentiment,
    })) ?? [];

  const gameLabel = (g: GameSuggestion["suggested_game"]) => {
    if (g === "focus") return "Focus (breathing 3D orb)";
    if (g === "memory") return "Memory (3D cubes)";
    return "Relaxation (floating 3D scene)";
  };

  const dashboardMood: BotMood = latestDay
    ? moodFromSignals({
        sentiment_label:
          latestDay.avg_sentiment > 0.25
            ? "positive"
            : latestDay.avg_sentiment < -0.25
            ? "negative"
            : "neutral",
        stress_label: latestDay.avg_stress >= 0.7 ? "stressed" : latestDay.avg_stress >= 0.3 ? "moderate" : "low",
      })
    : "neutral";

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Your emotional statistics</h1>
          <p className="text-sm text-slate-500">This view is based on your conversations and mood check-ins.</p>
        </div>
        <EmotionBot mood={dashboardMood} size="md" />
      </div>

      <div className="mb-2 p-3 bg-white border rounded-lg shadow-sm">
        <p className="text-sm font-medium mb-2">How are you feeling right now?</p>
        <div className="flex flex-wrap gap-2">
          {["very_negative", "negative", "neutral", "positive", "very_positive"].map((m) => (
            <button
              key={m}
              onClick={() => sendCheckin(m)}
              className="px-3 py-1 border rounded-full text-xs bg-slate-50 hover:bg-slate-100"
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
        {checkinStatus && <p className="text-xs text-emerald-600 mt-2">{checkinStatus}</p>}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Latest day mood</div>
              {latestDay ? (
                <>
                  <div className="text-emerald-600 font-semibold">{sentimentLabel(latestDay.avg_sentiment)}</div>
                  <div className="text-xs text-slate-500 mt-1">Sentiment score: {latestDay.avg_sentiment.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-400 mt-2">Date: {latestDay.date}</div>
                </>
              ) : (
                <div className="text-sm text-slate-400">No data yet. Try chatting with the assistant first.</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Latest day stress</div>
              {latestDay ? (
                <>
                  <div
                    className={
                      latestDay.avg_stress >= 0.7
                        ? "text-red-500 font-semibold"
                        : latestDay.avg_stress >= 0.3
                        ? "text-amber-500 font-semibold"
                        : "text-emerald-600 font-semibold"
                    }
                  >
                    {stressLabel(latestDay.avg_stress)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Stress score: {latestDay.avg_stress.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-sm text-slate-400">No stress data yet.</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">High-stress days</div>
              <div className="text-2xl font-bold text-slate-800">{data.high_stress_days}</div>
              <div className="text-xs text-slate-500 mt-1">Days where average stress is at least 0.7</div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">Suggested 3D mini-game</div>
              {loadingGameSuggestion && <div className="text-sm text-slate-400">Loading...</div>}
              {!loadingGameSuggestion && gameSuggestion && (
                <>
                  <div className="text-slate-800 text-sm font-semibold">{gameLabel(gameSuggestion.suggested_game)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{gameSuggestion.reason}</div>
                  {gameSuggestion.stress_score !== null && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Last stress score: {gameSuggestion.stress_score.toFixed(2)}
                      {gameSuggestion.risk_flag ? " (high risk detected)" : ""}
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/games")}
                    className="mt-2 text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600"
                  >
                    Start game
                  </button>
                </>
              )}
              {!loadingGameSuggestion && !gameSuggestion && (
                <div className="text-sm text-slate-400">Start chatting to get a tailored game suggestion.</div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-semibold">Stress over time</h2>
                <span className="text-[11px] text-slate-400">0 = low, 1 = high</span>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet. Interact with the assistant or add a check-in.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis domain={[0, 1]} fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="stress" stroke="#ef4444" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-semibold">Sentiment over time</h2>
                <span className="text-[11px] text-slate-400">-1 = very negative, 1 = very positive</span>
              </div>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet. Interact with the assistant or add a check-in.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis domain={[-1, 1]} fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sentiment" stroke="#22c55e" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FaceEmotionWidget />
          </div>

          <div className="bg-white rounded-xl shadow p-4 mt-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold">Recent days</h2>
              <span className="text-xs text-slate-400">Based on assistant responses and check-ins</span>
            </div>
            {data.days.length === 0 ? (
              <p className="text-sm text-slate-400">No history yet. Start a conversation in the chat or add a check-in.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-1 text-xs text-slate-500">Date</th>
                      <th className="text-left px-2 py-1 text-xs text-slate-500">Avg sentiment</th>
                      <th className="text-left px-2 py-1 text-xs text-slate-500">Avg stress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map((d) => (
                      <tr key={d.date} className="border-t">
                        <td className="px-2 py-1">{d.date}</td>
                        <td className="px-2 py-1">
                          {sentimentLabel(d.avg_sentiment)} ({d.avg_sentiment.toFixed(2)})
                        </td>
                        <td className="px-2 py-1">
                          {stressLabel(d.avg_stress)} ({d.avg_stress.toFixed(2)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
