type BotMood =
  | "angry"
  | "sad"
  | "fear"
  | "surprise"
  | "happy"
  | "love"
  | "disgust"
  | "neutral";

type Props = {
  mood: BotMood;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const moodToSrc: Record<BotMood, string> = {
  angry: "/bot-angry.png",
  sad: "/bot-sad.png",
  fear: "/bot-fear.png",
  surprise: "/bot-surprise.png",
  happy: "/bot-happy.png",
  love: "/bot-Love.png",
  disgust: "/bot-disgust.png",
  neutral: "/bot-happy.png",
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
};

export function EmotionBot({ mood, size = "md", className = "" }: Props) {
  const src = moodToSrc[mood] ?? moodToSrc.neutral;
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={`${mood} bot`}
        className={`${sizeClass[size]} drop-shadow-lg select-none`}
        loading="lazy"
      />
    </div>
  );
}

export type { BotMood };
