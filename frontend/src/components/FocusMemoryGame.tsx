"use client";

import { useEffect, useMemo, useState } from "react";

type Card = { id: number; icon: string };

const ICONS = ["📚", "🧠", "🕊️", "✨", "📖", "☕", "💡", "🎧"];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr]
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.v);
}

export default function FocusMemoryGame() {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const pairsCount = useMemo(() => {
    if (level === 1) return 4;
    if (level === 2) return 6;
    return 8;
  }, [level]);

  const baseTime = useMemo(() => Math.max(20, 60 - (level - 1) * 10), [level]);

  const initGame = () => {
    const selectedIcons = ICONS.slice(0, pairsCount);
    const deck = shuffleArray(selectedIcons.concat(selectedIcons).map((icon, index) => ({ id: index, icon })));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setCombo(1);
    setTimeLeft(baseTime);
    setIsRunning(true);
    setGameOver(false);
  };

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (!isRunning || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, gameOver]);

  const handleCardClick = (index: number) => {
    if (!isRunning || gameOver) return;
    if (flipped.includes(index) || matched.includes(index)) return;

    if (flipped.length === 0) {
      setFlipped([index]);
    } else if (flipped.length === 1) {
      const firstIndex = flipped[0];
      const secondIndex = index;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      setFlipped([firstIndex, secondIndex]);
      setMoves((m) => m + 1);

      if (firstCard.icon === secondCard.icon) {
        setTimeout(() => {
          setMatched((prev) => [...prev, firstIndex, secondIndex]);
          setFlipped([]);
        }, 400);
        setScore((s) => s + 100 * combo);
        setCombo((c) => c + 1);
      } else {
        setTimeout(() => setFlipped([]), 600);
        setCombo(1);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      setIsRunning(false);
      setTimeout(() => setGameOver(true), 500);
    }
  }, [matched, cards]);

  const handleNextLevel = () => setLevel((l) => Math.min(l + 1, 3));
  const handleRestart = () => initGame();

  const timePercent = Math.max(0, Math.min(100, (timeLeft / baseTime) * 100));

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white shadow-lg p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#3f3a64]">Focus Memory</h2>
          <p className="text-xs text-slate-500">Match the pairs to train focus. Higher levels = more cards & less time.</p>
        </div>
        <div className="flex flex-col items-end text-xs">
          <span className="font-semibold text-[#3f3a64]">Level {level}/3</span>
          <span className="text-slate-500">Moves: {moves}</span>
          <span className="text-slate-500">Combo: x{combo}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col text-xs">
          <span className="text-slate-500">Score</span>
          <span className="text-lg font-bold text-[#20ad96]">{score}</span>
        </div>
        <div className="flex-1 mx-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Time</span>
            <span>{timeLeft}s</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#20ad96] to-[#3a98f5] transition-all"
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index);
          return (
            <button
              key={card.id + "-" + index}
              onClick={() => handleCardClick(index)}
              className={`relative aspect-square rounded-xl flex items-center justify-center text-2xl md:text-3xl transition-all ${
                isFlipped ? "bg-white shadow-md border border-[#20ad96]/40" : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              <span className={`transition-opacity ${isFlipped ? "opacity-100" : "opacity-0"}`}>{card.icon}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button onClick={handleRestart} className="px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50">
          Restart
        </button>

        {gameOver && matched.length === cards.length && (
          <div className="flex items-center gap-2">
            <span className="text-[#20ad96] font-semibold">Great job! 🎉</span>
            {level < 3 ? (
              <button
                onClick={handleNextLevel}
                className="px-3 py-2 rounded-full bg-gradient-to-r from-[#20ad96] to-[#3a98f5] text-white text-xs font-semibold"
              >
                Next Level
              </button>
            ) : (
              <span className="text-slate-500">Max level reached. You&apos;re a focus master.</span>
            )}
          </div>
        )}

        {gameOver && matched.length !== cards.length && (
          <span className="text-red-500 text-xs">Time&apos;s up. Try again calmly.</span>
        )}
      </div>
    </div>
  );
}
