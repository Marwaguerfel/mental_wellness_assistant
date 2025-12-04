import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { apiFetch } from "../api/client";
import FocusMemoryGame from "../components/FocusMemoryGame";

function SceneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.2} />
      <OrbitControls enablePan={false} />
      {children}
    </Canvas>
  );
}

function BreathingSphere() {
  const mesh = useRef<any>();
  const start = useRef<number>(Date.now());

  useFrame(() => {
    const t = (Date.now() - start.current) / 1000;
    const cycle = 8;
    const phase = (t % cycle) / cycle;
    const scale = 1.05 + Math.sin(phase * Math.PI * 2) * 0.25;

    if (mesh.current) {
      mesh.current.scale.set(scale, scale, scale);
      mesh.current.material.emissiveIntensity = 0.5 + scale * 0.3;
    }
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.1, 48, 48]} />
      <meshStandardMaterial color="#22c55e" emissive="#16a34a" roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

function FocusGame3D() {
  return (
    <div className="h-80 rounded-xl overflow-hidden bg-slate-900 relative">
      <SceneWrapper>
        <BreathingSphere />
        <Html position={[0, -2.2, 0]} center style={{ pointerEvents: "none", textAlign: "center" }}>
          <div className="text-xs text-slate-100 bg-black/30 px-3 py-1 rounded-full">
            Inhale as the sphere grows, exhale as it shrinks.
          </div>
        </Html>
      </SceneWrapper>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-200 bg-black/40 px-3 py-1 rounded-full">
        Follow the pulse for 6-8 breaths.
      </div>
    </div>
  );
}

type CubeInfo = {
  id: number;
  position: [number, number, number];
  color: string;
};

const MEMORY_CUBES: CubeInfo[] = [
  { id: 0, position: [-2, 0, 0], color: "#38bdf8" },
  { id: 1, position: [0, 0, 0], color: "#a855f7" },
  { id: 2, position: [2, 0, 0], color: "#f97316" },
];

type MemoryState = "showing" | "input" | "done";

function MemoryCube({ info, isActive, onClick }: { info: CubeInfo; isActive: boolean; onClick: () => void }) {
  const mesh = useRef<any>();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.01;
      mesh.current.rotation.x += 0.005;
      mesh.current.scale.setScalar(isActive ? 1.3 : 1);
    }
  });

  return (
    <mesh ref={mesh} position={info.position} onClick={onClick} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={info.color}
        emissive={isActive ? info.color : "#000000"}
        emissiveIntensity={isActive ? 0.9 : 0.2}
        roughness={0.3}
        metalness={0.4}
      />
    </mesh>
  );
}

function MemoryGame3D() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [state, setState] = useState<MemoryState>("showing");
  const [userInput, setUserInput] = useState<number[]>([]);
  const [message, setMessage] = useState<string>("Watch the cubes light up in order...");
  const [canRestart, setCanRestart] = useState<boolean>(false);

  useEffect(() => {
    const seq = Array.from({ length: 3 }, () => Math.floor(Math.random() * MEMORY_CUBES.length));
    setSequence(seq);
    setState("showing");
    setUserInput([]);
    setCanRestart(false);
    setMessage("Watch the cubes light up in order...");

    let idx = 0;
    const interval = setInterval(() => {
      setHighlightIndex(seq[idx]);
      idx += 1;
      if (idx > seq.length) {
        clearInterval(interval);
        setTimeout(() => {
          setHighlightIndex(-1);
          setState("input");
          setMessage("Now click the cubes in the same order.");
        }, 600);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleCubeClick = (id: number) => {
    if (state !== "input") return;
    const nextInput = [...userInput, id];
    setUserInput(nextInput);

    const expected = sequence[nextInput.length - 1];
    if (id !== expected) {
      setMessage("Not quite. That was a different order. You can restart.");
      setState("done");
      setCanRestart(true);
      return;
    }

    if (nextInput.length === sequence.length) {
      setMessage("Great job! You matched the sequence 🎉");
      setState("done");
      setCanRestart(true);
    }
  };

  const restart = () => window.location.reload();

  return (
    <div className="h-80 rounded-xl overflow-hidden bg-slate-900 relative">
      <SceneWrapper>
        {MEMORY_CUBES.map((cube) => (
          <MemoryCube
            key={cube.id}
            info={cube}
            isActive={highlightIndex === cube.id}
            onClick={() => handleCubeClick(cube.id)}
          />
        ))}
      </SceneWrapper>
      <div className="absolute bottom-2 inset-x-2 text-xs text-slate-100 bg-black/40 px-3 py-2 rounded-lg">
        <div className="flex justify-between items-center gap-3">
          <span>{message}</span>
          {canRestart && (
            <button
              className="border border-slate-300 text-slate-100 px-2 py-1 rounded text-[11px] hover:bg-slate-700"
              onClick={restart}
            >
              Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FloatingShape({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<any>();
  const speed = useRef<number>(0.3 + Math.random() * 0.4);
  const phase = useRef<number>(Math.random() * Math.PI * 2);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed.current + phase.current;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t) * 0.4;
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x += 0.005;
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}

function RelaxGame3D() {
  const shapes: { position: [number, number, number]; color: string }[] = [
    { position: [-2, 0, 0], color: "#22c55e" },
    { position: [0, 1.2, -1], color: "#38bdf8" },
    { position: [2, -0.5, 1], color: "#a855f7" },
    { position: [-1.5, -1.2, -1.5], color: "#f97316" },
    { position: [1.5, 0.8, 1.5], color: "#e11d48" },
  ];

  return (
    <div className="h-80 rounded-xl overflow-hidden bg-slate-900 relative">
      <SceneWrapper>
        {shapes.map((s, idx) => (
          <FloatingShape key={idx} position={s.position} color={s.color} />
        ))}
        <Html position={[0, -2.3, 0]} center>
          <div className="text-xs text-slate-100 bg-black/40 px-3 py-1 rounded-full">
            Slowly move the view and just observe the motion.
          </div>
        </Html>
      </SceneWrapper>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-200 bg-black/40 px-3 py-1 rounded-full">
        Use your mouse to orbit the scene and breathe slowly.
      </div>
    </div>
  );
}

type GameTab = "focus" | "memory" | "relax";

type GameSuggestion = {
  suggested_game: GameTab;
  reason: string;
  stress_score: number | null;
  risk_flag: boolean;
};

export default function Games() {
  const [activeTab, setActiveTab] = useState<GameTab>("focus");
  const [suggestion, setSuggestion] = useState<GameSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState<boolean>(true);

  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        const res = await apiFetch<GameSuggestion>("/api/games/recommend");
        setSuggestion(res);
        if (res.suggested_game) {
          setActiveTab(res.suggested_game);
        }
      } catch (err) {
        console.error("Error loading game suggestion", err);
      } finally {
        setLoadingSuggestion(false);
      }
    };

    loadSuggestion();
  }, []);

  return (
    <div className="mt-4 space-y-4">
      <h1 className="text-lg font-semibold">Mind mini-games (3D)</h1>
      <p className="text-sm text-slate-500">
        These playful 3D experiences are designed to help you focus, train your memory, and relax your nervous system.
      </p>

      <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg flex justify-between items-center">
        <div>
          <span className="font-semibold">Suggested for you: </span>
          {loadingSuggestion && <span>Loading...</span>}
          {!loadingSuggestion && suggestion && (
            <>
              <span className="capitalize">{suggestion.suggested_game}</span>
              {suggestion.reason && (
                <span className="block text-[11px] text-emerald-700 mt-0.5">{suggestion.reason}</span>
              )}
            </>
          )}
          {!loadingSuggestion && !suggestion && (
            <span>Start a conversation in the chat to get a suggestion.</span>
          )}
        </div>
        {suggestion && (
          <button
            onClick={() => setActiveTab(suggestion.suggested_game)}
            className="ml-3 text-[11px] border border-emerald-500 text-emerald-700 px-2 py-1 rounded-full hover:bg-emerald-100"
          >
            Go to {suggestion.suggested_game}
          </button>
        )}
      </div>

      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setActiveTab("focus")}
          className={
            "px-3 py-1 rounded-full border " +
            (activeTab === "focus"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-slate-700 border-slate-300")
          }
        >
          Focus
        </button>
        <button
          onClick={() => setActiveTab("memory")}
          className={
            "px-3 py-1 rounded-full border " +
            (activeTab === "memory"
              ? "bg-sky-500 text-white border-sky-500"
              : "bg-white text-slate-700 border-slate-300")
          }
        >
          Memory
        </button>
        <button
          onClick={() => setActiveTab("relax")}
          className={
            "px-3 py-1 rounded-full border " +
            (activeTab === "relax"
              ? "bg-violet-500 text-white border-violet-500"
              : "bg-white text-slate-700 border-slate-300")
          }
        >
          Relaxation
        </button>
      </div>

      <div>
        {activeTab === "focus" && <FocusGame3D />}
        {activeTab === "memory" && <FocusMemoryGame />}
        {activeTab === "relax" && <RelaxGame3D />}
      </div>

      <p className="text-[11px] text-slate-400">
        These mini-games are not medical tools, but gentle practices to support focus, regulation and relaxation.
      </p>
    </div>
  );
}
