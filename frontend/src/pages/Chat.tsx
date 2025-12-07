import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import { EmotionBot, type BotMood } from "../components/EmotionBot";
import { moodFromSignals } from "../utils/botMood";

type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  created_at?: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

type ChatResponse = {
  reply: string;
  ai_reply?: string;
  sentiment_label: string;
  stress_label: string;
  stress_score: number | null;
  risk_flag: boolean;
};

type RecognitionType = any;

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [voiceMode, setVoiceMode] = useState<"on" | "off">("on");
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [botMood, setBotMood] = useState<BotMood>("neutral");

  const recognitionRef = useRef<RecognitionType>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anyWindow = window as any;
    const SpeechRecognition = anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechAvailable(false);
      setVoiceError("Voice input is not supported in this browser. Try Chrome/Edge on desktop.");
      return;
    }

    const recognition: any = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setVoiceError(event?.error === "not-allowed" ? "Microphone permission was denied." : "Voice input error. Try again.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognitionRef.current = recognition;
    setSpeechAvailable(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (voiceMode === "off") return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender !== "assistant") return;
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    synth.speak(utterance);
  }, [messages, voiceMode]);

  // hydrate sessions
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat_sessions");
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        setSessions(parsed);
        if (parsed[0]) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
        }
        return;
      }
    } catch (err) {
      console.error("Failed to load chat sessions", err);
    }

    const newSession: ChatSession = { id: crypto.randomUUID(), title: "New chat", messages: [] };
    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    localStorage.setItem("chat_sessions", JSON.stringify([newSession]));
  }, []);

  const trimTitle = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return "Chat";
    return trimmed.length > 30 ? trimmed.slice(0, 30) + "..." : trimmed;
  };

  const persistSessions = (next: ChatSession[]) => {
    setSessions(next);
    localStorage.setItem("chat_sessions", JSON.stringify(next));
  };

  const setMessagesForCurrent = (nextMessages: ChatMessage[], firstUserText?: string) => {
    setMessages(nextMessages);
    if (!currentSessionId) return;
    persistSessions(
      sessions.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: nextMessages,
              title: s.title === "New chat" && firstUserText ? trimTitle(firstUserText) : s.title,
            }
          : s
      )
    );
  };

  const startNewChat = () => {
    const newSession: ChatSession = { id: crypto.randomUUID(), title: "New chat", messages: [] };
    const nextSessions = [newSession, ...sessions];
    persistSessions(nextSessions);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setInput("");
    setBotMood("neutral");
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setCurrentSessionId(sessionId);
    setMessages(session.messages || []);
    setInput("");
    setBotMood("neutral");
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let activeId = currentSessionId;
    if (!activeId) {
      activeId = crypto.randomUUID();
      const newSession: ChatSession = { id: activeId, title: trimTitle(trimmed), messages: [] };
      const nextSessions = [newSession, ...sessions];
      persistSessions(nextSessions);
      setCurrentSessionId(activeId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: trimmed,
    };

    const nextUserMessages = [...messages, userMessage];
    setMessagesForCurrent(nextUserMessages, trimmed);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch<ChatResponse>("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "assistant",
        text: res.reply || res.ai_reply || "",
      };

      const withAssistant = [...nextUserMessages, assistantMessage];
      setMessagesForCurrent(withAssistant);
      setBotMood(
        moodFromSignals({
          sentiment_label: res.sentiment_label,
          stress_label: res.stress_label,
          risk_flag: res.risk_flag,
        })
      );
    } catch (err) {
      console.error(err);
      const fallback: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "assistant",
        text: "I'm sorry, something went wrong while generating a response. Please try again in a moment.",
      };
      setMessagesForCurrent([...nextUserMessages, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const summarizeSession = (session: ChatSession) => {
    const total = session.messages.length;
    const userCount = session.messages.filter((m) => m.sender === "user").length;
    const assistantCount = total - userCount;
    const firstUser = session.messages.find((m) => m.sender === "user");
    const lastAssistant = [...session.messages].reverse().find((m) => m.sender === "assistant");

    return {
      title: session.title || "Chat",
      total,
      userCount,
      assistantCount,
      firstUserText: firstUser?.text ?? "",
      lastAssistantText: lastAssistant?.text ?? "",
    };
  };

  const fetchModelSummary = async (session: ChatSession) => {
    try {
      const res = await apiFetch<{ summary?: string; bullets?: string[] }>("/api/chat/summary", {
        method: "POST",
        body: JSON.stringify({ messages: session.messages }),
      });
      const summaryText = res.summary || "";
      const bulletText = res.bullets?.length ? res.bullets.join("\n") : "";
      if (summaryText || bulletText) {
        return { summaryText, bulletText };
      }
    } catch (err) {
      console.warn("Falling back to local summary", err);
    }
    const local = summarizeSession(session);
    const summaryText = `Conversation with ${local.total} messages. First user prompt: ${local.firstUserText || "N/A"}. Last assistant reply: ${local.lastAssistantText || "N/A"}.`;
    const bulletText = `- Total: ${local.total}\n- User: ${local.userCount}\n- Assistant: ${local.assistantCount}`;
    return { summaryText, bulletText };
  };

  const downloadSummaryAsPdf = async () => {
    if (!currentSession) return;
    setSummaryLoading(true);
    const modelSummary = await fetchModelSummary(currentSession);
    setSummaryLoading(false);
    const summary = summarizeSession(currentSession);
    const htmlConversation = currentSession.messages
      .map(
        (m) =>
          `<div style="margin-bottom:8px;"><strong>${m.sender === "user" ? "You" : "Assistant"}:</strong> ${m.text
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</div>`
      )
      .join("");

    const html = `
<!doctype html>
<html>
<head>
  <title>${summary.title} - Chat Summary</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1 { margin: 0 0 8px 0; }
    .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>${summary.title}</h1>
  <div class="meta">
    Total messages: ${summary.total} | You: ${summary.userCount} | Assistant: ${summary.assistantCount}
  </div>
  <div class="card">
    <h2 style="margin-top:0;">Model Summary</h2>
    <p>${modelSummary.summaryText || "No summary available."}</p>
    ${modelSummary.bulletText ? `<pre style="background:#f8fafc;padding:12px;border-radius:8px;">${modelSummary.bulletText}</pre>` : ""}
  </div>
  <div class="card">
    <h2 style="margin-top:0;">Highlights</h2>
    <p><strong>First user prompt:</strong> ${summary.firstUserText || "—"}</p>
    <p><strong>Last assistant reply:</strong> ${summary.lastAssistantText || "—"}</p>
  </div>
  <div class="card">
    <h2 style="margin-top:0;">Conversation</h2>
    ${htmlConversation || "<p>No messages yet.</p>"}
  </div>
</body>
</html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow popups to download the PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 200);
  };

  const toggleListening = () => {
    const recog = recognitionRef.current;
    if (!speechAvailable || !recog) {
      setVoiceError("Voice input unavailable. Please check browser support and mic permissions.");
      return;
    }
    if (isListening) {
      recog.stop();
    } else {
      recog.start();
      setVoiceError(null);
    }
  };

  const stopVoice = () => window.speechSynthesis?.cancel();

  return (
    <div className="mt-4 h-[calc(100vh-80px)] flex gap-4">
      <aside className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">History</h2>
          <button
            onClick={startNewChat}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            New chat
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto">
          {sessions.length === 0 && <p className="text-[11px] text-slate-400">No chats yet</p>}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => switchSession(s.id)}
              className={
                "w-full text-left px-3 py-2 rounded-lg border text-xs " +
                (s.id === currentSessionId
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50")
              }
            >
              <div className="truncate">{s.title || "Chat"}</div>
              <div className="text-[10px] text-slate-400">{s.messages.length} messages</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Chat</h1>
            <p className="text-xs text-slate-500">Type or speak your message. The assistant can also read replies aloud.</p>
          </div>

          <div className="flex items-center gap-3">
            <EmotionBot mood={botMood} size="sm" />
            <button
              onClick={downloadSummaryAsPdf}
              disabled={!currentSession || currentSession.messages.length === 0 || summaryLoading}
              className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {summaryLoading ? "Preparing..." : "Download summary (PDF)"}
            </button>
            <button
              onClick={() => {
                const next = voiceMode === "on" ? "off" : "on";
                setVoiceMode(next);
                if (next === "off") stopVoice();
              }}
              className={
                "text-xs px-2 py-1 rounded-full border " +
                (voiceMode === "on"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-slate-600 border-slate-300")
              }
            >
              {voiceMode === "on" ? "Voice ON" : "Voice OFF"}
            </button>

            {speechAvailable ? (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={
                    "w-2 h-2 rounded-full " +
                    (isListening ? "bg-red-500 animate-pulse" : "bg-slate-300")
                  }
                />
                <span className="text-slate-500">{isListening ? "Listening..." : "Mic ready"}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Voice input not supported in this browser.</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-10">
              Start talking about how you feel. You can type or use the microphone.
            </p>
          )}

          {messages.map((m) => (
            <div key={m.id} className={"flex " + (m.sender === "user" ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[80%] px-3 py-2 text-sm rounded-2xl shadow-sm " +
                  (m.sender === "user"
                    ? "bg-emerald-500 text-white rounded-br-none"
                    : "bg-white text-slate-800 rounded-bl-none")
                }
              >
                {m.text}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
              rows={2}
              placeholder="Type your message here."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleListening}
              disabled={!speechAvailable}
              className={
                "w-10 h-10 rounded-full flex items-center justify-center border text-xs " +
                (isListening ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-700 border-slate-300")
              }
              title={speechAvailable ? (isListening ? "Stop listening" : "Start voice input") : "Speech not supported"}
            >
              Mic
            </button>

            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500 text-white text-lg disabled:opacity-60"
              title="Send message"
              style={{
                backgroundImage: "url('/chat-icon.svg')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "60%",
              }}
            >
              <span className="sr-only">Send</span>
            </button>
          </div>
        </div>

        {loading && <p className="mt-1 text-[11px] text-slate-400">Thinking about a supportive response.</p>}
        {voiceError && <p className="mt-1 text-[11px] text-red-500">{voiceError}</p>}
      </div>
    </div>
  );
}
