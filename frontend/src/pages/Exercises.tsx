import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type Exercise = {
  id: string;
  title: string;
  type: "breathing" | "grounding" | "journaling";
  duration_minutes: number;
  difficulty: string;
  tags: string[];
  description: string;
  steps: string[];
};

type SearchResponse = {
  items: Exercise[];
};

export default function Exercises() {
  const [recommended, setRecommended] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    setLoadingRec(true);
    apiFetch<SearchResponse>("/api/exercises/recommend")
      .then((res) => {
        setRecommended(res.items);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load recommendations.");
      })
      .finally(() => setLoadingRec(false));
  }, []);

  const search = async () => {
    setLoadingSearch(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (typeFilter !== "all") params.set("type", typeFilter);

      const path =
        "/api/exercises/search" +
        (params.toString() ? `?${params.toString()}` : "");

      const res = await apiFetch<SearchResponse>(path);
      setSearchResults(res.items);
    } catch (err) {
      console.error(err);
      setError("Error searching exercises.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const typeBadge = (type: string) => {
    if (type === "breathing") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (type === "grounding") return "bg-sky-50 text-sky-700 border-sky-200";
    return "bg-violet-50 text-violet-700 border-violet-200";
  };

  const listToShow =
    searchResults.length > 0 || query.trim() || typeFilter !== "all"
      ? searchResults
      : recommended;

  return (
    <div className="mt-4 space-y-4">
      <h1 className="text-lg font-semibold">Wellness exercises</h1>
      <p className="text-sm text-slate-500">
        These short practices are suggested based on your recent stress level and mood. You can also search for specific exercises.
      </p>

      <div className="bg-white rounded-xl shadow p-3 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          className="flex-1 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
          placeholder="Search for 'sleep', 'anxiety', 'panic'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex items-center gap-2 text-xs mt-1 md:mt-0">
          <span className="text-slate-500">Type:</span>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="breathing">Breathing</option>
            <option value="grounding">Grounding</option>
            <option value="journaling">Journaling</option>
          </select>
          <button
            onClick={search}
            disabled={loadingSearch}
            className="bg-emerald-500 text-white px-3 py-1 rounded text-xs disabled:opacity-60"
          >
            {loadingSearch ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold">
            {searchResults.length > 0 || query.trim() || typeFilter !== "all"
              ? "Search results"
              : "Recommended for you"}
          </h2>
          {loadingRec && <span className="text-xs text-slate-400">Loading...</span>}
        </div>

        {listToShow.length === 0 ? (
          <p className="text-sm text-slate-400">
            No exercises found. Try a different search or use the chat for support.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {listToShow.map((ex) => (
              <div key={ex.id} className="border rounded-lg p-3 text-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-slate-800">{ex.title}</h3>
                    <span className={"border text-[10px] px-2 py-0.5 rounded-full " + typeBadge(ex.type)}>
                      {ex.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    Duration: {ex.duration_minutes} min · Difficulty: {ex.difficulty}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">{ex.description}</p>
                  {ex.tags && ex.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ex.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActiveExercise(ex)}
                  className="mt-3 self-start text-xs text-emerald-600 underline"
                >
                  View steps
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeExercise && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white max-w-md w-full rounded-xl shadow-lg p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-800">{activeExercise.title}</h3>
              <button
                onClick={() => setActiveExercise(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Type: {activeExercise.type} · Duration: {activeExercise.duration_minutes} min · Difficulty: {activeExercise.difficulty}
            </p>
            <p className="text-sm text-slate-700 mb-2">{activeExercise.description}</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
              {activeExercise.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
