import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

type EmotionResult = {
  emotion: string;
  scores: Record<string, number>;
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001";

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

export default function FaceEmotionWidget() {
  const webcamRef = useRef<Webcam | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Could not capture image.");
      return;
    }

    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "face.jpg");

    const token = localStorage.getItem("access_token");

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BASE_URL}/api/emotion/face`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: EmotionResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Could not analyze emotion.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">Quick facial emotion scan</h2>
        <button
          type="button"
          onClick={() => setIsCameraOn((prev) => !prev)}
          className="text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          {isCameraOn ? "Turn camera off" : "Turn camera on"}
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Only a single snapshot is sent securely to estimate your current facial emotion.
      </p>

      {isCameraOn ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-36 rounded-lg overflow-hidden bg-black">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={captureAndAnalyze}
            disabled={loading}
            className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Capture & analyze"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Turn on the camera to run a quick emotion scan.</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="mt-2 text-xs">
          <div>
            <span className="font-semibold text-slate-700">Detected:</span>{" "}
            <span className="capitalize">{result.emotion}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Scores:
            <ul className="mt-1 grid grid-cols-2 gap-x-4">
              {Object.entries(result.scores).map(([label, score]) => (
                <li key={label}>
                  {label}: {(score * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
