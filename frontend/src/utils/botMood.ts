import type { BotMood } from "../components/EmotionBot";

export function moodFromSignals(opts: {
  sentiment_label?: string;
  stress_label?: string;
  risk_flag?: boolean;
  face_emotion?: string | null;
}): BotMood {
  const { sentiment_label, stress_label, risk_flag, face_emotion } = opts;

  if (risk_flag || stress_label === "high" || stress_label === "stressed") {
    if (face_emotion === "Fear" || face_emotion === "Sad") return "fear";
    return "sad";
  }

  if (sentiment_label === "very_negative" || face_emotion === "Angry") return "angry";
  if (sentiment_label === "negative" || face_emotion === "Sad") return "sad";
  if (face_emotion === "Surprise") return "surprise";
  if (sentiment_label === "positive" || sentiment_label === "very_positive" || face_emotion === "Happy")
    return "happy";

  return "neutral";
}
