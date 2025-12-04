import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type UserProfile = {
  id: string;
  email: string;
  display_name?: string | null;
  language?: string | null;
  timezone?: string | null;
  goal?: string | null;
  show_streaks: boolean;
  created_at?: string | null;
};

type UpdateProfilePayload = {
  display_name?: string;
  language?: string;
  timezone?: string;
  goal?: string;
  show_streaks?: boolean;
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("");
  const [goal, setGoal] = useState("");
  const [showStreaks, setShowStreaks] = useState(true);
  const [avatarData, setAvatarData] = useState<string | null>(null);

  // local-only enrichments
  const [pronouns, setPronouns] = useState("");
  const [location, setLocation] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [about, setAbout] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState<number | undefined>(undefined);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<UserProfile>("/api/me");
        setProfile(res);
        setDisplayName(res.display_name ?? "");
        setLanguage(res.language ?? "en");
        setTimezone(res.timezone ?? "");
        setGoal(res.goal ?? "");
        setShowStreaks(res.show_streaks);
        setError(null);

        // hydrate local-only details
        const localExtras = localStorage.getItem("profile_extras");
        if (localExtras) {
          try {
            const parsed = JSON.parse(localExtras);
            setPronouns(parsed.pronouns ?? "");
            setLocation(parsed.location ?? "");
            setFocusAreas(parsed.focusAreas ?? "");
            setAbout(parsed.about ?? "");
            setWeeklyGoal(parsed.weeklyGoal ?? undefined);
            setNotifyEmail(parsed.notifyEmail ?? true);
            setNotifyDigest(parsed.notifyDigest ?? false);
          } catch {
            /* ignore */
          }
        }
        const localAvatar = localStorage.getItem("profile_avatar");
        if (localAvatar) setAvatarData(localAvatar);
      } catch (err) {
        console.error(err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const onSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    const payload: UpdateProfilePayload = {
      display_name: displayName || undefined,
      language: language || undefined,
      timezone: timezone || undefined,
      goal: goal || undefined,
      show_streaks: showStreaks,
    };

    try {
      const updated = await apiFetch<UserProfile>("/api/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setProfile(updated);
      setSuccess("Profile updated.");

      // persist local-only enrichments
      localStorage.setItem(
        "profile_extras",
        JSON.stringify({
          pronouns,
          location,
          focusAreas,
          about,
          weeklyGoal,
          notifyEmail,
          notifyDigest,
        })
      );
      if (avatarData) {
        localStorage.setItem("profile_avatar", avatarData);
      } else {
        localStorage.removeItem("profile_avatar");
      }
    } catch (err) {
      console.error(err);
      setError("Could not save changes.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const onAvatarUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? null;
      setAvatarData(result);
    };
    reader.readAsDataURL(file);
  };

  const resetAvatar = () => {
    setAvatarData(null);
    localStorage.removeItem("profile_avatar");
  };

  return (
    <div className="mt-4 space-y-4">
      <h1 className="text-lg font-semibold">Your profile</h1>
      <p className="text-sm text-slate-500">
        Manage your account information and personalization settings for the mental wellness assistant.
      </p>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && profile && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarData ? (
                  <img
                    src={avatarData}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-semibold">
                    {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 bg-white rounded-full border border-slate-200 shadow p-1 cursor-pointer hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onAvatarUpload(e.target.files?.[0])}
                  />
                  <span className="text-[10px] text-slate-600">Edit</span>
                </label>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{profile.display_name || "No display name set"}</div>
                <div className="text-xs text-slate-500">{profile.email}</div>
                {pronouns && <div className="text-[11px] text-slate-400">Pronouns: {pronouns}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetAvatar}
                className="text-xs border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50"
              >
                Remove photo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Display name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should the assistant call you?"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Preferred language</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fr">Francais</option>
                <option value="de">Deutsch</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Pronouns</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, he/him, they/them..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Location</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Berlin, Germany"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Time zone</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Europe/Berlin"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Focus areas</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="Stress, sleep, focus, resilience..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Weekly study/wellness goal (hours)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                value={weeklyGoal ?? ""}
                onChange={(e) => setWeeklyGoal(e.target.value ? Number(e.target.value) : undefined)}
                min={0}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Your wellness goal</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 min-h-[80px]"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Example: 'Reduce evening anxiety and sleep better' or 'Track my stress around exams'."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">About you</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 min-h-[90px]"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Share a short note to personalize your experience."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="show_streaks"
                type="checkbox"
                className="w-4 h-4"
                checked={showStreaks}
                onChange={(e) => setShowStreaks(e.target.checked)}
              />
              <label htmlFor="show_streaks" className="text-xs text-slate-600 cursor-pointer">
                Show progress streaks and summaries on my statistics page
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                />
                Email check-in reminders
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={notifyDigest}
                  onChange={(e) => setNotifyDigest(e.target.checked)}
                />
                Weekly progress digest
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-slate-400">
              {profile.created_at && <>Member since {new Date(profile.created_at).toLocaleDateString()}</>}
            </div>
            <div className="flex items-center gap-2">
              {success && <span className="text-xs text-emerald-600">{success}</span>}
              {error && !success && <span className="text-xs text-red-500">{error}</span>}
              <button
                onClick={onSave}
                disabled={saving}
                className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
