import { Component, Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, Dispatch, FormEvent, ReactNode, RefObject, SetStateAction } from "react";

declare const __REPLIT_WORKSPACE_URL__: string;

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; msg: string }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, msg: e?.message || "Errore" };
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ color: "#fca5a5", fontSize: 12, padding: 16 }}>
            ⚠ Errore nel rendering del piano. Prova a usare ↩ Ripristina dal tab Storico.
            <br />
            <span style={{ color: "#71717a", fontSize: 11 }}>{this.state.msg}</span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

const KEYS = {
  mcs: "claudia.mcs.document",
  mcsVersions: "claudia.mcs.versions",
  references: "claudia.references",
  grok: "claudia.grok.report",
  history: "claudia.history",
  settings: "claudia.settings",
  images: "claudia.images",
  chat: "claudia.chat.messages",
  token: "claudia.auth.token",
  activePlanId: "claudia.active.plan",
};

const BASE = "/api";
function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(KEYS.token) || "";
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

const PILLAR_OPTIONS = [
  { id: "auto", label: "Automatico (mix bilanciato)" },
  { id: "P1", label: "P1 — Lifestyle / Vita Roma" },
  { id: "P2", label: "P2 — Self-Care & Palestra" },
  { id: "P3", label: "P3 — Sensual / Glam" },
  { id: "P4", label: "P4 — Emotional Depth" },
  { id: "P5", label: "P5 — Shopping & Cultura" },
];

const WEATHER_OPTIONS = [
  "Soleggiato",
  "Nuvoloso",
  "Pioggia leggera",
  "Pioggia forte",
  "Temporale",
  "Vento",
  "Caldo afoso",
  "Freddo",
];

const PLATFORM_OPTIONS = [
  { id: "all", label: "Tutte (TikTok + IG + Stories)" },
  { id: "tiktok", label: "Solo TikTok" },
  { id: "instagram", label: "Solo Instagram Reels" },
  { id: "stories", label: "Solo Stories" },
  { id: "carousel", label: "Solo Carosello IG" },
];

type HistoryItem = {
  id: string;
  date: string;
  weather: string;
  pillarFocus: string;
  platform: string;
  output: string;
  createdAt: string;
};

type ImageRef = { id: string; name: string; dataUrl: string };

type McsVersion = {
  id: string;
  name: string; // es. MCS_2026-04-22_08-45.md
  savedAt: string;
  content: string;
  reason?: string;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  versionId?: string;
  at: string;
};

type Settings = {
  pillarFocus: string;
  platform: string;
  contentVolume: number;
};

const DEFAULT_SETTINGS: Settings = {
  pillarFocus: "auto",
  platform: "all",
  contentVolume: 5,
};

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify(): Promise<boolean> {
    if (!pwd.trim() || loading) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) return true;
      setError("Password errata. Riprova.");
      return false;
    } catch {
      setError("Errore di connessione. Riprova.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await verify();
    if (ok) onLogin(pwd);
  }

  async function goToAgent() {
    const ok = await verify();
    if (ok && __REPLIT_WORKSPACE_URL__) {
      window.open(__REPLIT_WORKSPACE_URL__, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 20,
          padding: 36,
          boxShadow: "0 0 60px rgba(255,0,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            background: "linear-gradient(135deg,#ff00ff,#c026d3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 4,
            letterSpacing: "-0.03em",
          }}
        >
          CLAUDIA HUB
        </div>
        <div style={{ fontSize: 12, color: "#71717a", marginBottom: 32 }}>
          Area riservata · Accesso privato
        </div>
        <form onSubmit={submit}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#a1a1aa",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(null); }}
            placeholder="Inserisci la password"
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#09090b",
              border: `1px solid ${error ? "#ef4444" : "#3f3f46"}`,
              borderRadius: 10,
              color: "white",
              fontSize: 14,
              padding: "12px 14px",
              outline: "none",
              marginBottom: 12,
            }}
          />
          {error && (
            <div
              style={{
                color: "#fca5a5",
                fontSize: 12,
                marginBottom: 12,
                padding: "8px 10px",
                background: "rgba(239,68,68,0.1)",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !pwd.trim()}
            style={{
              width: "100%",
              padding: "13px",
              background: loading
                ? "#3f3f46"
                : "linear-gradient(135deg,#ff00ff,#c026d3)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontWeight: 900,
              fontSize: 13,
              cursor: loading ? "wait" : "pointer",
              letterSpacing: "0.08em",
              opacity: !pwd.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "VERIFICA..." : "ACCEDI"}
          </button>

          {__REPLIT_WORKSPACE_URL__ && (
            <button
              type="button"
              onClick={goToAgent}
              disabled={loading || !pwd.trim()}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "11px",
                background: "transparent",
                border: "1px solid rgba(255,0,255,0.35)",
                borderRadius: 10,
                color: "#e879f9",
                fontWeight: 700,
                fontSize: 12,
                cursor: loading || !pwd.trim() ? "not-allowed" : "pointer",
                letterSpacing: "0.08em",
                opacity: !pwd.trim() ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            >
              ✦ VAI ALL'AGENT
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string>(
    () => localStorage.getItem(KEYS.token) || "",
  );

  if (!token) {
    return (
      <LoginScreen
        onLogin={(t) => {
          localStorage.setItem(KEYS.token, t);
          setToken(t);
        }}
      />
    );
  }

  return <Main token={token} onLogout={() => { localStorage.removeItem(KEYS.token); setToken(""); }} />;
}

function Main({ token: _token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<
    | "planner"
    | "grok"
    | "mcs"
    | "references"
    | "files"
    | "chat"
    | "history"
    | "stats"
    | "outfit"
  >("planner");

  // Persistent state
  const [mcs, setMcs] = useState<string>(
    () => localStorage.getItem(KEYS.mcs) || "",
  );
  const [references, setReferences] = useState<string>(
    () => localStorage.getItem(KEYS.references) || "",
  );
  const [grokReport, setGrokReport] = useState<string>(
    () => localStorage.getItem(KEYS.grok) || "",
  );
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.history) || "[]");
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(localStorage.getItem(KEYS.settings) || "{}"),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [images, setImages] = useState<ImageRef[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.images) || "[]");
    } catch {
      return [];
    }
  });
  const [mcsVersions, setMcsVersions] = useState<McsVersion[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.mcsVersions) || "[]");
    } catch {
      return [];
    }
  });
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.chat) || "[]");
    } catch {
      return [];
    }
  });

  // Generation form
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [dayNumber, setDayNumber] = useState("");
  const [dayNumberLoading, setDayNumberLoading] = useState(true);
  const [weather, setWeather] = useState(WEATHER_OPTIONS[0]);
  const [customNotes, setCustomNotes] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(() => localStorage.getItem("claudia.weeklyGoal") ?? "");

  // Piano attivo (persiste nel cloud — sopravvive alla chiusura del browser)
  const [activePlan, setActivePlan] = useState<HistoryItem | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  // Draft auto-save
  const DRAFT_KEY = "claudia.draft";
  type DraftData = { output: string; date: string; savedAt: string };
  const [draft, setDraft] = useState<DraftData | null>(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"); }
    catch { return null; }
  });
  const [draftDismissed, setDraftDismissed] = useState(false);

  useEffect(() => {
    if (!generating || !output) return;
    const id = setInterval(() => {
      const d: DraftData = { output, date, savedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      setDraft(d);
    }, 30_000);
    return () => clearInterval(id);
  }, [generating, output, date]);

  // Auto-fetch day number from DB
  useEffect(() => {
    setDayNumberLoading(true);
    apiFetch("/history/day-number")
      .then((r) => r.json())
      .then((data) => {
        if (data.dayNumber !== undefined) {
          setDayNumber(String(data.dayNumber));
        }
        setDayNumberLoading(false);
      })
      .catch(() => {
        setDayNumberLoading(false);
      });
  }, []);

  // ── Carica stato dal database all'avvio (fonte di verità permanente) ──────
  useEffect(() => {
    apiFetch("/state")
      .then((r) => r.ok ? r.json() : null)
      .then((res: { data?: Record<string, string> } | null) => {
        if (!res?.data) return;
        const d = res.data;
        if (d[KEYS.mcs] !== undefined) {
          setMcs(d[KEYS.mcs]);
          localStorage.setItem(KEYS.mcs, d[KEYS.mcs]);
        }
        if (d[KEYS.references] !== undefined) {
          setReferences(d[KEYS.references]);
          localStorage.setItem(KEYS.references, d[KEYS.references]);
        }
        if (d[KEYS.grok] !== undefined) {
          setGrokReport(d[KEYS.grok]);
          localStorage.setItem(KEYS.grok, d[KEYS.grok]);
        }
        if (d[KEYS.settings] !== undefined) {
          try {
            const s = { ...DEFAULT_SETTINGS, ...JSON.parse(d[KEYS.settings]) };
            setSettings(s);
            localStorage.setItem(KEYS.settings, d[KEYS.settings]);
          } catch { /* ignore */ }
        }
        if (d[KEYS.images] !== undefined) {
          try {
            const imgs = JSON.parse(d[KEYS.images]);
            setImages(imgs);
            try { localStorage.setItem(KEYS.images, d[KEYS.images]); } catch { /* quota */ }
          } catch { /* ignore */ }
        }
        if (d[KEYS.mcsVersions] !== undefined) {
          try {
            const vers = JSON.parse(d[KEYS.mcsVersions]);
            setMcsVersions(vers);
            try { localStorage.setItem(KEYS.mcsVersions, d[KEYS.mcsVersions]); } catch { /* quota */ }
          } catch { /* ignore */ }
        }
        if (d[KEYS.chat] !== undefined) {
          try {
            const msgs = JSON.parse(d[KEYS.chat]);
            setChatMsgs(msgs);
            localStorage.setItem(KEYS.chat, d[KEYS.chat]);
          } catch { /* ignore */ }
        }
        if (d[KEYS.activePlanId] && d[KEYS.activePlanId].trim()) {
          const planId = d[KEYS.activePlanId].trim();
          apiFetch(`/history/${planId}`)
            .then((r) => r.ok ? r.json() : null)
            .then((data: HistoryItem | null) => {
              if (data?.output) setActivePlan(data);
            })
            .catch(() => {});
        }
      })
      .catch(() => { /* usa localStorage come fallback */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: salva chiave nel DB (fire-and-forget)
  function dbSave(key: string, value: string) {
    apiFetch(`/state/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).catch(() => {});
  }

  // ── Persist — localStorage immediato + DB con debounce 1.5s ──────────────
  useEffect(() => {
    localStorage.setItem(KEYS.mcs, mcs);
    const t = setTimeout(() => dbSave(KEYS.mcs, mcs), 1500);
    return () => clearTimeout(t);
  }, [mcs]);
  useEffect(() => {
    localStorage.setItem(KEYS.references, references);
    const t = setTimeout(() => dbSave(KEYS.references, references), 1500);
    return () => clearTimeout(t);
  }, [references]);
  useEffect(() => {
    localStorage.setItem(KEYS.grok, grokReport);
    const t = setTimeout(() => dbSave(KEYS.grok, grokReport), 1500);
    return () => clearTimeout(t);
  }, [grokReport]);
  useEffect(() => {
    localStorage.setItem(KEYS.history, JSON.stringify(history.slice(0, 50)));
  }, [history]);
  useEffect(() => {
    const val = JSON.stringify(settings);
    localStorage.setItem(KEYS.settings, val);
    const t = setTimeout(() => dbSave(KEYS.settings, val), 1500);
    return () => clearTimeout(t);
  }, [settings]);
  useEffect(() => {
    const val = JSON.stringify(images);
    try { localStorage.setItem(KEYS.images, val); } catch {
      try { localStorage.setItem(KEYS.images, JSON.stringify(images.slice(-Math.max(1, images.length - 1)))); } catch { /* ignore */ }
    }
    const t = setTimeout(() => dbSave(KEYS.images, val), 1500);
    return () => clearTimeout(t);
  }, [images]);
  useEffect(() => {
    const val = JSON.stringify(mcsVersions.slice(0, 30));
    try { localStorage.setItem(KEYS.mcsVersions, val); } catch { /* ignore */ }
    const t = setTimeout(() => dbSave(KEYS.mcsVersions, val), 1500);
    return () => clearTimeout(t);
  }, [mcsVersions]);
  useEffect(() => {
    const val = JSON.stringify(chatMsgs.slice(-200));
    localStorage.setItem(KEYS.chat, val);
    const t = setTimeout(() => dbSave(KEYS.chat, val), 1500);
    return () => clearTimeout(t);
  }, [chatMsgs]);

  // Elapsed timer for plan generation
  useEffect(() => {
    if (!generating) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [generating]);

  // Client-side progress animation: advances bar smoothly while generating,
  // independent of server SSE events (which may be buffered by the proxy).
  // The server event for 100% will override this when Claude actually finishes.
  useEffect(() => {
    if (!generating) return;
    const CURVE = [
      { sec: 8,  pct: 18 },
      { sec: 18, pct: 28 },
      { sec: 30, pct: 40 },
      { sec: 45, pct: 55 },
      { sec: 60, pct: 68 },
      { sec: 75, pct: 80 },
      { sec: 88, pct: 92 },
    ];
    const startedAt = Date.now();
    const t = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      for (const step of CURVE) {
        if (elapsed >= step.sec) {
          setProgress((prev) => (prev < step.pct ? step.pct : prev));
        }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [generating]);

  const mcsActive = mcs.trim().length > 0;
  const refsActive = references.trim().length > 0;
  const grokActive = grokReport.trim().length > 0;

  async function generate() {
    setError(null);
    setOutput("");
    setProgress(0);
    setStage("Avvio...");
    setGenerating(true);

    // Cattura la data pianificata nel momento esatto in cui parte la generazione
    const planDate = date;

    const fullNotes = [
      customNotes,
      `Pillar focus: ${settings.pillarFocus}`,
      `Piattaforma: ${settings.platform}`,
      `Volume contenuti target: ${settings.contentVolume}`,
    ]
      .filter(Boolean)
      .join("\n");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      // 1. Avvia il job — richiesta breve, ritorna subito con un jobId
      // Costruisce il sommario dei 3 ultimi piani per la memoria AI
      const recentHistory = history
        .slice(0, 3)
        .map((it) => {
          const titles = [...(it.output || "").matchAll(/##\s+PUBBLICAZIONE[^\n]*/gi)].map((m) => m[0].trim());
          const outfits = [...(it.output || "").matchAll(/Outfit[:\s]+([^\n]+)/gi)].map((m) => m[1].trim());
          const dateLabel = it.date
            ? new Date((it.date).slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
            : it.date;
          return [
            `— ${dateLabel} | Pillar: ${it.pillarFocus || "N/D"} | Piattaforma: ${it.platform || "N/D"}`,
            titles.length ? `  Pubblicazioni: ${titles.slice(0, 6).join(" | ")}` : "",
            outfits.length ? `  Outfit usati: ${outfits.slice(0, 4).join(", ")}` : "",
          ].filter(Boolean).join("\n");
        })
        .join("\n\n");

      const startRes = await apiFetch("/plan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          date,
          dayNumber,
          weather,
          grokReport,
          mcsDocument: mcs,
          references,
          customNotes: fullNotes,
          contentVolume: settings.contentVolume,
          images: images.slice(0, 6).map((i) => ({
            dataUrl: i.dataUrl,
            name: i.name,
          })),
          weeklyGoal: weeklyGoal.trim() || undefined,
          recentHistory: recentHistory.trim() || undefined,
        }),
      });

      if (!startRes.ok) throw new Error(`HTTP ${startRes.status}`);
      const { jobId } = await startRes.json() as { jobId: string };

      setStage("Generazione in corso...");

      // 2. Polling ogni 3 secondi — ogni richiesta dura <1 secondo, nessun timeout proxy
      while (true) {
        if (ac.signal.aborted) break;
        await new Promise((r) => setTimeout(r, 3000));
        if (ac.signal.aborted) break;

        const pollRes = await apiFetch(`/plan/status/${jobId}`, {
          signal: ac.signal,
        });
        if (!pollRes.ok) continue;
        const poll = await pollRes.json() as { status: string; result?: string; error?: string };

        if (poll.status === "done") {
          const finalText = poll.result || "";
          setOutput(finalText);
          setProgress(100);
          setStage("Completato");

          const item: HistoryItem = {
            id: Date.now().toString(),
            date: planDate,
            weather,
            pillarFocus: settings.pillarFocus,
            platform: settings.platform,
            output: finalText,
            createdAt: new Date().toISOString(),
          };
          setHistory((h) => [item, ...h].slice(0, 50));
          setActivePlan(item);
          apiFetch("/history/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          }).catch(() => {});
          localStorage.removeItem(DRAFT_KEY);
          setDraft(null);
          dbSave(KEYS.activePlanId, item.id);
          break;
        } else if (poll.status === "error") {
          throw new Error(poll.error || "Errore sconosciuto");
        }
        // ancora pending — continua a fare polling
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Errore");
        setStage("Errore");
      } else {
        setStage("Interrotto");
      }
    }

    setGenerating(false);
  }

  function stop() {
    abortRef.current?.abort();
    setGenerating(false);
    setStage("Interrotto");
  }

  function downloadOutput() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claudia-piano-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHistoryItem(it: HistoryItem) {
    const blob = new Blob([it.output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claudia-piano-${it.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearActivePlan() {
    setActivePlan(null);
    setOutput("");
    dbSave(KEYS.activePlanId, "");
  }

  function restorePlan(item: HistoryItem) {
    setActivePlan(item);
    setOutput("");
    dbSave(KEYS.activePlanId, item.id);
    setTab("planner");
  }


  async function uploadFile(
    e: ChangeEvent<HTMLInputElement>,
    setter: (s: string) => void,
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    setter(txt);
    e.target.value = "";
  }

  const tabs = useMemo(
    () => [
      { id: "planner", label: "Smart Planner", icon: "✦" },
      { id: "chat", label: "Chat MCS", icon: "✎" },
      { id: "files", label: "File / Immagini", icon: "▦" },
      { id: "mcs", label: "MCS / DNA", icon: "◈" },
      { id: "references", label: "Referenze", icon: "◇" },
      { id: "grok", label: "Grok / Trend Live", icon: "◉" },
      { id: "history", label: "Storico", icon: "▤" },
      { id: "stats", label: "Statistiche", icon: "◎" },
      { id: "outfit", label: "Outfit Register", icon: "👗" },
    ],
    [],
  );

  return (
    <div style={shell}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>CLAUDIA HUB</h1>
          <div style={subtitleStyle}>
            AI Autonoma · Trend + Piano Completo · Memoria Persistente
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={badgesRow}>
            <Badge label="DNA" active={mcsActive} />
            <Badge label="TREND" active={grokActive} forceLabel={grokActive ? "MANUAL" : "AUTO"} />
            <Badge label="REFS" active={refsActive} />
          </div>
          {__REPLIT_WORKSPACE_URL__ && (
            <a
              href={__REPLIT_WORKSPACE_URL__}
              target="_blank"
              rel="noopener noreferrer"
              title="Apri l'AI Agent Replit"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "linear-gradient(135deg, rgba(255,0,255,0.15), rgba(124,58,237,0.15))",
                border: "1px solid rgba(255,0,255,0.35)",
                borderRadius: 8,
                color: "#e879f9",
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 10px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              ✦ AGENT
            </a>
          )}
          <button
            onClick={() => window.location.reload()}
            title="Aggiorna l'app"
            style={{
              background: "none",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#71717a",
              fontSize: 15,
              fontWeight: 700,
              padding: "4px 9px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ⟳
          </button>
          <button
            onClick={onLogout}
            title="Esci"
            style={{
              background: "none",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#71717a",
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 10px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            ESCI
          </button>
        </div>
      </header>

      <nav style={tabsRow}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={tabBtn(tab === t.id)}
          >
            <span style={{ marginRight: 6, opacity: 0.6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={mainStyle}>
        {/* Banner recupero draft */}
        {draft && !draftDismissed && !generating && !activePlan && (
          <div style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>Draft salvato automaticamente</div>
              <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 1 }}>
                Piano del {draft.date} · {new Date(draft.savedAt).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  const item: HistoryItem = {
                    id: `draft-${Date.now()}`,
                    date: draft.date,
                    weather: "",
                    pillarFocus: "",
                    platform: "",
                    output: draft.output,
                    createdAt: draft.savedAt,
                  };
                  setActivePlan(item);
                  setOutput(draft.output);
                  setTab("planner");
                  setDraftDismissed(true);
                }}
                style={{ background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Recupera
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setDraft(null);
                  setDraftDismissed(true);
                }}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
              >
                Ignora
              </button>
            </div>
          </div>
        )}

        {tab === "planner" && (
          <PlannerTab
            date={date}
            setDate={setDate}
            dayNumber={dayNumber}
            setDayNumber={setDayNumber}
            dayNumberLoading={dayNumberLoading}
            weather={weather}
            setWeather={setWeather}
            settings={settings}
            setSettings={setSettings}
            customNotes={customNotes}
            setCustomNotes={setCustomNotes}
            weeklyGoal={weeklyGoal}
            setWeeklyGoal={(g) => { setWeeklyGoal(g); localStorage.setItem("claudia.weeklyGoal", g); }}
            generating={generating}
            progress={progress}
            stage={stage}
            error={error}
            output={output}
            outputRef={outputRef}
            generate={generate}
            stop={stop}
            downloadOutput={downloadOutput}
            mcsVersions={mcsVersions}
            elapsed={elapsed}
            activePlan={activePlan}
            clearActivePlan={clearActivePlan}
          />
        )}
        {tab === "grok" && (
          <SimpleEditor
            title="Grok — Trend & Viral Live"
            description="Incolla qui la ricerca di Grok su trend e viral del momento. Quando è presente, Claude la userà come unica fonte per generare le idee del piano — ignorando la sua analisi automatica. Rimane attiva finché non la cancelli con il tasto apposito."
            value={grokReport}
            setValue={setGrokReport}
            placeholder="Incolla qui la ricerca Grok su trend e viral (audio TikTok IT, format Reels, orari picco, opportunità del momento…)&#10;&#10;Lascia vuoto per usare l'analisi automatica di Claude."
            uploadAccept=".txt,.md"
            onUpload={(e) => uploadFile(e, setGrokReport)}
            lockWhenFilled
          />
        )}
        {tab === "mcs" && (
          <SimpleEditor
            title="Documento MCS / Character DNA"
            description="Master Control System di Claudia. Carica il file .docx (esportato in .txt/.md) o incolla l'intero documento. Tutte le generazioni useranno queste regole."
            value={mcs}
            setValue={setMcs}
            placeholder="Incolla qui il documento MCS completo (regole, pillar, identity lock, anti-repetition, breast rule, text overlay, etc.)"
            uploadAccept=".txt,.md,.json"
            onUpload={(e) => uploadFile(e, setMcs)}
          />
        )}
        {tab === "references" && (
          <SimpleEditor
            title="Referenze Influencer"
            description="Descrivi Claudia in dettaglio: aspetto fisico, stile, location preferite di Roma, brand, palestra, abitudini, tono di voce. Più dettagli inserisci, più i prompt saranno aderenti."
            value={references}
            setValue={setReferences}
            placeholder="Identity lock dettagliato, location preferite, outfit ricorrenti, brand, palestra, palette colori, tono di voce caption..."
            uploadAccept=".txt,.md,.json"
            onUpload={(e) => uploadFile(e, setReferences)}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            history={history}
            setHistory={setHistory}
            downloadHistoryItem={downloadHistoryItem}
            mcs={mcs}
            restorePlan={restorePlan}
            activePlanId={activePlan?.id ?? null}
          />
        )}
        {tab === "stats" && (
          <StatsTab history={history} />
        )}
        {tab === "outfit" && (
          <OutfitTab history={history} />
        )}
        {tab === "files" && (
          <FilesTab
            images={images}
            setImages={setImages}
            mcs={mcs}
            setMcs={setMcs}
            references={references}
            setReferences={setReferences}
          />
        )}
        {tab === "chat" && (
          <ChatTab
            mcs={mcs}
            setMcs={setMcs}
            mcsVersions={mcsVersions}
            setMcsVersions={setMcsVersions}
            chatMsgs={chatMsgs}
            setChatMsgs={setChatMsgs}
          />
        )}
      </main>
    </div>
  );
}

/* ============================ Output Renderer ============================ */

const LABEL_RE =
  /\b(Location|Scena|Azione|Outfit|Musica|Caption|Hashtag|Pillar|Orario|Meteo|Nota|KPI|Copertina|Testo overlay|Primo commento|Prompt immagine|Prompt video|Movimento camera|Movimento|Tipo|Formato|Mood|Atmosfera|Luce|Unghie|Smalto|Durata|Tempo|Effetto|Filtro|Audio|Trend|Tag|CTA|Hook|Ritmo|Transizione|Musica scelta|Obiettivo|Platform|Pillar focus|Giorno|Data|Stagione):/gi;

function renderLineWithLabels(line: string, k: number): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(LABEL_RE.source, "gi");
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    parts.push(
      <strong key={`lbl-${k}-${match.index}`} style={{ color: "#e879f9", fontWeight: 800 }}>
        {match[0]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return <Fragment key={k}>{parts}</Fragment>;
}

function RenderOutput({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let bufferLines: string[] = [];
  let key = 0;

  function flushBuffer() {
    if (bufferLines.length === 0) return;
    const rendered = bufferLines.map((line, i) => (
      <Fragment key={i}>
        {renderLineWithLabels(line, key * 1000 + i)}
        {i < bufferLines.length - 1 ? "\n" : ""}
      </Fragment>
    ));
    elements.push(
      <pre
        key={`buf-${key++}`}
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          fontSize: 12,
          color: "#e4e4e7",
          lineHeight: 1.65,
        }}
      >
        {rendered}
      </pre>,
    );
    bufferLines = [];
  }

  for (const line of lines) {
    const isPub = /PUBBLICAZIONE\s*\d+/i.test(line);

    if (line.startsWith("# ") || (line.startsWith("## ") && isPub)) {
      flushBuffer();
      const title = line.replace(/^#{1,2} /, "");
      elements.push(
        <div
          key={`pub-${key++}`}
          style={{
            fontSize: 18,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "linear-gradient(135deg, #ff00ff, #c026d3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "32px 0 8px",
            paddingTop: 12,
            borderTop: "2px solid rgba(255,0,255,0.35)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>,
      );
    } else if (line.startsWith("## ")) {
      flushBuffer();
      const title = line.slice(3);
      elements.push(
        <div
          key={`h2-${key++}`}
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#d946ef",
            margin: "20px 0 4px",
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </div>,
      );
    } else if (line.startsWith("### ")) {
      flushBuffer();
      const title = line.slice(4);
      elements.push(
        <div
          key={`h3-${key++}`}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#a78bfa",
            margin: "10px 0 2px",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {title}
        </div>,
      );
    } else if (line.startsWith("#### ")) {
      flushBuffer();
      const title = line.slice(5);
      elements.push(
        <div
          key={`h4-${key++}`}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#7dd3fc",
            margin: "8px 0 2px",
          }}
        >
          {title}
        </div>,
      );
    } else if (/^-{3,}$/.test(line.trim())) {
      flushBuffer();
      elements.push(
        <hr
          key={`hr-${key++}`}
          style={{
            border: "none",
            borderTop: "1px solid #3f3f46",
            margin: "10px 0",
          }}
        />,
      );
    } else {
      bufferLines.push(line);
    }
  }
  flushBuffer();

  return (
    <div style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
      {elements}
    </div>
  );
}

/* ============================ Copy helpers ============================ */

function extractCopyFields(body: string) {
  function extract(label: string): string {
    const re = new RegExp(
      `\\*{0,2}${label}[^\\n*]*\\*{0,2}:?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*\\*{1,2}[A-ZÀÈÉÌÒÙ]|\\n#{2,}|$)`,
      "i",
    );
    return (body.match(re)?.[1] ?? "").replace(/\*+/g, "").trim();
  }
  const caption = extract("Caption(?:\\s+pronta)?");
  const hashtag = extract("Hashtag");
  const captionHashtag = [caption, hashtag].filter(Boolean).join("\n\n");
  return {
    promptImg: extract("PROMPT IMMAGINE"),
    promptVideo: extract("PROMPT VIDEO"),
    canzone: extract("(?:Canzone|Musica scelta|Brano|Song)"),
    hook: extract("(?:Hook|Frase(?:\\s+di)?\\s*aggancio|Frase(?:\\s+di)?\\s*apertura|Frase(?:\\s+)iniziale)"),
    sondaggio: extract("Sondaggio"),
    fine: extract("(?:Frase di fine|Frase(?:\\s+di)?\\s*(?:chiusura|congedo)|Chiusura|Conclusione)"),
    caption,
    hashtag,
    captionHashtag,
    primoCommento: extract("Primo commento"),
  };
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [phase, setPhase] = useState<"idle" | "copying" | "done">("idle");
  if (!text) return null;
  function handleCopy() {
    setPhase("copying");
    navigator.clipboard.writeText(text).then(() => {
      setTimeout(() => setPhase("done"), 350);
    }).catch(() => setPhase("idle"));
  }
  const bg = phase === "done" ? "rgba(34,197,94,0.18)" : phase === "copying" ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.05)";
  const border = phase === "done" ? "#22c55e" : phase === "copying" ? "#f97316" : "rgba(255,255,255,0.1)";
  const color = phase === "done" ? "#22c55e" : phase === "copying" ? "#f97316" : "#71717a";
  return (
    <button
      onClick={handleCopy}
      title={`Copia ${label}`}
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, color, fontSize: 10, fontWeight: 700, padding: "3px 9px", cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap", letterSpacing: "0.03em" }}
    >
      {phase === "done" ? `✓ ${label}` : phase === "copying" ? "..." : `📋 ${label}`}
    </button>
  );
}

function PubRow({ icon, label, text }: { icon: string; label: string; text: string }) {
  const [phase, setPhase] = useState<"idle" | "copying" | "done">("idle");
  function handleCopy() {
    setPhase("copying");
    navigator.clipboard.writeText(text).then(() => {
      setTimeout(() => setPhase("done"), 350);
    }).catch(() => setPhase("idle"));
  }
  const btnBg = phase === "done" ? "rgba(34,197,94,0.18)" : phase === "copying" ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.05)";
  const btnBorder = phase === "done" ? "#22c55e" : phase === "copying" ? "#f97316" : "rgba(255,255,255,0.12)";
  const btnColor = phase === "done" ? "#22c55e" : phase === "copying" ? "#f97316" : "#71717a";
  const rowBorder = phase === "done" ? "rgba(34,197,94,0.25)" : phase === "copying" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.06)";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "7px 10px", border: `1px solid ${rowBorder}`, transition: "border-color 0.25s" }}>
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#52525b", letterSpacing: "0.07em", marginBottom: 2, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#d4d4d8", lineHeight: 1.5, wordBreak: "break-word" }}>{text}</div>
      </div>
      <button
        onClick={handleCopy}
        style={{ flexShrink: 0, background: btnBg, border: `1px solid ${btnBorder}`, borderRadius: 6, color: btnColor, fontSize: 11, fontWeight: 800, padding: "4px 10px", cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap", marginTop: 2 }}
      >
        {phase === "done" ? "✓" : phase === "copying" ? "⏳" : "📋"}
      </button>
    </div>
  );
}

function parseTimeMins(body: string): number | null {
  const m = body.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

/* ============================ Plan With Progress ============================ */

function PlanWithProgress({ text, planId, planDate }: { text: string; planId: string; planDate?: string }) {
  type Section = { title: string; body: string; index: number };

  const sections: Section[] = [];
  let intro = "";
  const lines = text.split("\n");
  let currentSection: Section | null = null;
  let currentLines: string[] = [];

  // Primo passaggio: cerca intestazioni con parole chiave pubblicazione
  const isPubLine = (line: string) =>
    /^#{1,6}[^#\n]*(?:pubblicazione|post|reel|tiktok|storia|video|contenuto)[^#\n]*\d+/i.test(line);

  for (const line of lines) {
    if (isPubLine(line)) {
      if (currentSection) {
        currentSection.body = currentLines.join("\n");
        sections.push(currentSection);
      } else {
        intro = currentLines.join("\n");
      }
      currentSection = { title: line, body: "", index: sections.length };
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentSection) {
    currentSection.body = currentLines.join("\n");
    sections.push(currentSection);
  } else {
    if (!intro) intro = currentLines.join("\n");
  }

  // Fallback: se non ha trovato sezioni con parole chiave, usa qualsiasi ## heading numerico
  if (sections.length === 0 && intro.trim()) {
    const allLines = intro.split("\n");
    let fbSection: Section | null = null;
    let fbLines: string[] = [];
    let foundAny = false;
    for (const line of allLines) {
      const isHeading = /^#{1,4}\s*.+\d+/.test(line);
      if (isHeading) {
        foundAny = true;
        if (fbSection) {
          fbSection.body = fbLines.join("\n");
          sections.push(fbSection);
        } else {
          intro = fbLines.join("\n");
        }
        fbSection = { title: line, body: "", index: sections.length };
        fbLines = [];
      } else {
        fbLines.push(line);
      }
    }
    if (fbSection) {
      fbSection.body = fbLines.join("\n");
      sections.push(fbSection);
    } else if (!foundAny) {
      intro = allLines.join("\n");
    }
  }

  const totalCount = sections.length;
  const storageKey = `claudia.progress.${planId}`;
  const skipKey = `claudia.skipped.${planId}`;
  const [done, setDone] = useState<Set<number>>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s ? new Set<number>(JSON.parse(s)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [skipped, setSkipped] = useState<Set<number>>(() => {
    try {
      const s = localStorage.getItem(skipKey);
      return s ? new Set<number>(JSON.parse(s)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [planTab, setPlanTab] = useState<"piano" | "pubblica" | "strategia">("piano");
  const [notifGranted, setNotifGranted] = useState<NotificationPermission>(() => {
    if (typeof Notification !== "undefined") return Notification.permission;
    return "denied";
  });
  const [notifOn, setNotifOn] = useState(true);
  const notifTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (totalCount > 0 && planDate) {
      const outfitLines = text.match(/Outfit[:\s]+[^\n]+/gi) ?? [];
      const outfits = [...new Set(outfitLines.map((o) => o.replace(/^Outfit[:\s]*/i, "").trim()))];
      if (outfits.length > 0) {
        localStorage.setItem(`claudia.outfits.${planId}`, JSON.stringify({ date: planDate, outfits }));
      }
    }
  }, [planId, planDate, text, totalCount]);

  function scheduleNotifications() {
    notifTimersRef.current.forEach(clearTimeout);
    notifTimersRef.current = [];
    const now = new Date();
    let scheduled = 0;
    sections.forEach((sec, idx) => {
      const t = parseTimeMins(sec.body);
      if (t === null) return;
      const todayTarget = new Date();
      todayTarget.setHours(Math.floor(t / 60), t % 60, 0, 0);
      const diff = todayTarget.getTime() - now.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          if (Notification.permission === "granted" && !done.has(idx)) {
            new Notification(`📍 Claudia Hub — Pubblicazione ${idx + 1}`, {
              body: sec.title.replace(/^#+\s*/, "").slice(0, 80),
              icon: "/favicon.ico",
              tag: `claudia-pub-${planId}-${idx}`,
            });
          }
        }, diff);
        notifTimersRef.current.push(timer);
        scheduled++;
      }
    });
    return scheduled;
  }

  function cancelNotifications() {
    notifTimersRef.current.forEach(clearTimeout);
    notifTimersRef.current = [];
  }

  async function handleNotifToggle() {
    if (typeof Notification === "undefined") return;
    if (notifOn) {
      cancelNotifications();
      setNotifOn(false);
    } else {
      const perm = await Notification.requestPermission();
      setNotifGranted(perm);
      if (perm === "granted") scheduleNotifications();
      setNotifOn(perm === "granted");
    }
  }

  // Auto-attiva notifiche al mount se permesso già concesso
  useEffect(() => {
    if (notifOn && typeof Notification !== "undefined" && Notification.permission === "granted") {
      scheduleNotifications();
    }
    return () => cancelNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  function toggle(idx: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
    // se era saltata, rimuovi da skipped
    setSkipped((prev) => {
      if (!prev.has(idx)) return prev;
      const next = new Set(prev);
      next.delete(idx);
      localStorage.setItem(skipKey, JSON.stringify([...next]));
      return next;
    });
  }

  function skipToggle(idx: number) {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else {
        next.add(idx);
        // rimuovi da done se era fatto
        setDone((d) => {
          if (!d.has(idx)) return d;
          const nd = new Set(d);
          nd.delete(idx);
          localStorage.setItem(storageKey, JSON.stringify([...nd]));
          return nd;
        });
      }
      localStorage.setItem(skipKey, JSON.stringify([...next]));
      return next;
    });
  }

  function resetAll() {
    setDone(new Set());
    setSkipped(new Set());
    localStorage.removeItem(storageKey);
    localStorage.removeItem(skipKey);
  }

  const doneCount = done.size;
  const allDone = totalCount > 0 && doneCount === totalCount;

  useEffect(() => {
    if (totalCount > 0) {
      localStorage.setItem(`claudia.total.${planId}`, String(totalCount));
    }
  }, [planId, totalCount]);

  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const nextIdx = sections.reduce((acc, sec, i) => {
    if (acc !== -1) return acc;
    const t = parseTimeMins(sec.body);
    return t !== null && t >= nowMins ? i : -1;
  }, -1);

  const hasAnalysis = totalCount > 0 && intro.trim().length > 0;

  // Focus overlay section
  const focusSec = focusIdx !== null ? sections[focusIdx] : null;
  const focusFields = focusSec ? extractCopyFields(focusSec.body) : null;
  const focusDone = focusIdx !== null ? done.has(focusIdx) : false;

  return (
    <div>
      {/* ── FOCUS MODE OVERLAY ── */}
      {focusSec && focusIdx !== null && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#09090b",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            position: "sticky",
            top: 0,
            background: "rgba(9,9,11,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            zIndex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#d946ef", letterSpacing: "0.08em" }}>
                📱 FOCUS — PUB {focusIdx + 1} / {sections.length}
              </span>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: focusDone ? "#ef4444" : "#22c55e",
                boxShadow: focusDone ? "0 0 6px 2px rgba(239,68,68,0.6)" : "0 0 6px 2px rgba(34,197,94,0.6)",
                display: "inline-block",
              }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setFocusIdx((i) => (i !== null && i > 0 ? i - 1 : i))} disabled={focusIdx === 0} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#a1a1aa", padding: "5px 12px", cursor: "pointer", fontSize: 12, opacity: focusIdx === 0 ? 0.3 : 1 }}>‹ Prec</button>
              <button onClick={() => setFocusIdx((i) => (i !== null && i < sections.length - 1 ? i + 1 : i))} disabled={focusIdx === sections.length - 1} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#a1a1aa", padding: "5px 12px", cursor: "pointer", fontSize: 12, opacity: focusIdx === sections.length - 1 ? 0.3 : 1 }}>Succ ›</button>
              <button
                onClick={() => setFocusIdx(null)}
                style={{ background: "rgba(217,70,239,0.12)", border: "1px solid rgba(217,70,239,0.3)", borderRadius: 6, color: "#e879f9", padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                ◀ Torna al piano
              </button>
            </div>
          </div>

          {/* Contenuto pubblicazione */}
          <div style={{ padding: "24px 20px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
            <div style={{ opacity: focusDone ? 0.5 : 1, transition: "opacity 0.3s" }}>
              <RenderOutput text={focusSec.title} />
              <div style={{ marginTop: 16 }}>
                <RenderOutput text={focusSec.body} />
              </div>
            </div>

            {/* Bottoni copia */}
            {!focusDone && focusFields && (
              <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
                <CopyBtn text={focusFields.promptImg} label="Prompt Immagine" />
                <CopyBtn text={focusFields.promptVideo} label="Prompt Video" />
                <CopyBtn text={focusFields.caption} label="Caption" />
                <CopyBtn text={focusFields.hashtag} label="Hashtag" />
              </div>
            )}

            {/* Toggle fatto/non fatto */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => toggle(focusIdx)}
                style={{
                  padding: "14px 40px",
                  borderRadius: 999,
                  border: `2px solid ${focusDone ? "#ef4444" : "#22c55e"}`,
                  background: focusDone ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                  color: focusDone ? "#ef4444" : "#22c55e",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                {focusDone ? "↩ Segna come da fare" : "✓ Segna come fatto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini-tabs Piano | Prompts | Strategia + pulsante notifiche */}
      {totalCount > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          {([
            { id: "pubblica", label: `🚀 PUBBLICA` },
            { id: "piano", label: `📋 PIANO` },
            ...(hasAnalysis ? [{ id: "strategia", label: "📊 STRATEGIA" }] : []),
          ] as { id: "piano" | "pubblica" | "strategia"; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setPlanTab(t.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: `1px solid ${planTab === t.id ? "#d946ef" : "#3f3f46"}`,
                background: planTab === t.id ? "rgba(217,70,239,0.15)" : "transparent",
                color: planTab === t.id ? "#e879f9" : "#71717a",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB PUBBLICA ── */}
      {planTab === "pubblica" && (() => {
        // Mostra solo sezioni con "PUBBLICAZIONE" nel titolo
        const pubSections = sections.map((sec, idx) => ({ sec, idx })).filter(({ sec }) =>
          /pubblicazione/i.test(sec.title.replace(/^#+\s*/, ""))
        );
        const activePubs = pubSections.filter(({ idx }) => !skipped.has(idx));
        const skippedPubs = pubSections.filter(({ idx }) => skipped.has(idx));
        const pubDoneCount = activePubs.filter(({ idx }) => done.has(idx)).length;
        const pubTotal = activePubs.length;
        const pubAllDone = pubTotal > 0 && pubDoneCount === pubTotal;

        const ALL_COPY_FIELDS: { key: string; label: string; icon: string }[] = [
          { key: "promptImg", label: "Prompt Immagine", icon: "🖼" },
          { key: "promptVideo", label: "Prompt Video", icon: "🎬" },
          { key: "canzone", label: "Canzone", icon: "🎵" },
          { key: "hook", label: "Frase di aggancio + posizione schermo", icon: "🎣" },
          { key: "sondaggio", label: "Sondaggio (Stories/Post/Carosello)", icon: "🗳️" },
          { key: "fine", label: "Frase di fine + posizione schermo", icon: "🔚" },
          { key: "captionHashtag", label: "Caption + Hashtag", icon: "✍️" },
          { key: "primoCommento", label: "Primo commento", icon: "💬" },
        ];

        function IslandCard({ sec, idx, isArchive }: { sec: { title: string; body: string }; idx: number; isArchive?: boolean }) {
          const isDone = done.has(idx);
          const isSkipped = skipped.has(idx);
          const isNext = idx === nextIdx && !isDone && !isSkipped;
          const timeM = parseTimeMins(sec.body);
          const timeStr = timeM !== null ? `${String(Math.floor(timeM / 60)).padStart(2, "0")}:${String(timeM % 60).padStart(2, "0")}` : null;
          const fields = extractCopyFields(sec.body);
          const titleClean = sec.title.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();

          // 🔴 da fare | 🟡 in scadenza | 🟢 fatto | 🟠 saltata
          const borderCol = isSkipped ? "#f97316" : isDone ? "#22c55e" : isNext ? "#fbbf24" : "#ef4444";
          const bgCol = isSkipped ? "rgba(249,115,22,0.05)" : isDone ? "rgba(34,197,94,0.05)" : isNext ? "rgba(251,191,36,0.04)" : "rgba(239,68,68,0.05)";
          const glowCol = isSkipped ? "rgba(249,115,22,0.12)" : isDone ? "rgba(34,197,94,0.12)" : isNext ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.12)";

          return (
            <div style={{ marginBottom: 16, borderRadius: 12, border: `2px solid ${borderCol}`, background: bgCol, transition: "all 0.3s ease", boxShadow: `0 0 14px 2px ${glowCol}`, opacity: isSkipped ? 0.6 : 1 }}>
              {/* Header */}
              <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${borderCol}33`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: borderCol, boxShadow: `0 0 6px 2px ${borderCol}88`, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontWeight: 800, fontSize: 13, color: isSkipped || isDone ? "#71717a" : "#f4f4f5", flex: 1, textDecoration: isSkipped ? "line-through" : "none" }}>
                  {titleClean}
                </span>
                {timeStr && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: isNext ? "#fbbf24" : "#71717a", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px", border: `1px solid ${isNext ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                    🕐 {timeStr}
                  </span>
                )}
                {isNext && <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>📍 ORA</span>}
                {isDone && <span style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>✓ FATTO</span>}
                {isSkipped && <span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>⏭ SALTATA</span>}
              </div>

              {/* Righe copiabili */}
              {!isSkipped && (
                <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {ALL_COPY_FIELDS.map(({ key, label, icon }) => {
                    const val = fields[key as keyof typeof fields];
                    if (!val) return null;
                    return <PubRow key={key} icon={icon} label={label} text={val} />;
                  })}
                </div>
              )}

              {/* Footer pulsanti */}
              <div style={{ padding: "8px 14px 12px", display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {!isSkipped && (
                  <button
                    onClick={() => skipToggle(idx)}
                    title="Salta questa pubblicazione"
                    style={{ padding: "6px 14px", borderRadius: 8, border: "2px solid #f97316", background: "rgba(249,115,22,0.08)", color: "#f97316", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s" }}
                  >
                    ⏭ Salta
                  </button>
                )}
                {isSkipped && (
                  <button
                    onClick={() => skipToggle(idx)}
                    title="Ripristina questa pubblicazione"
                    style={{ padding: "6px 14px", borderRadius: 8, border: "2px solid #71717a", background: "rgba(113,113,122,0.08)", color: "#a1a1aa", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s" }}
                  >
                    ↩ Ripristina
                  </button>
                )}
                {!isSkipped && (
                  <button
                    onClick={() => toggle(idx)}
                    title={isDone ? "Segna come da fare" : "Segna come fatto"}
                    style={{
                      padding: "7px 18px", borderRadius: 8,
                      border: `2px solid ${isDone ? "#22c55e" : "#ef4444"}`,
                      background: isDone ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      color: isDone ? "#22c55e" : "#ef4444",
                      fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em",
                      transition: "all 0.25s ease",
                      boxShadow: isDone ? "0 0 10px 2px rgba(34,197,94,0.2)" : "0 0 10px 2px rgba(239,68,68,0.2)",
                    }}
                  >
                    {isDone ? "✓ FATTO" : "● DA FARE"}
                  </button>
                )}
              </div>
            </div>
          );
        }

        return (
          <>
            {/* Barra progresso */}
            {pubTotal > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "8px 12px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ flex: 1, height: 5, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(pubDoneCount / pubTotal) * 100}%`, background: pubAllDone ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#d946ef,#9333ea)", borderRadius: 3, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: pubAllDone ? "#22c55e" : "#a1a1aa", whiteSpace: "nowrap" }}>
                  {pubAllDone ? "✓ TUTTE COMPLETATE" : `${pubDoneCount} / ${pubTotal} fatte`}
                </span>
                {skippedPubs.length > 0 && <span style={{ fontSize: 10, color: "#f97316", whiteSpace: "nowrap" }}>⏭ {skippedPubs.length} saltate</span>}
                {(doneCount > 0 || skipped.size > 0) && (
                  <button onClick={resetAll} style={{ fontSize: 10, color: "#71717a", background: "none", border: "1px solid #3f3f46", cursor: "pointer", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Reset</button>
                )}
              </div>
            )}

            {/* Isole attive */}
            {activePubs.map(({ sec, idx }) => (
              <IslandCard key={idx} sec={sec} idx={idx} />
            ))}

            {/* Archivio saltate */}
            {skippedPubs.length > 0 && (
              <div style={{ marginTop: 24, borderTop: "1px solid rgba(249,115,22,0.2)", paddingTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#f97316", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⏭</span> ARCHIVIO SALTATE ({skippedPubs.length})
                </div>
                {skippedPubs.map(({ sec, idx }) => (
                  <IslandCard key={idx} sec={sec} idx={idx} isArchive />
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ── TAB PIANO ── */}
      {planTab === "piano" && (
        <>
          {/* Barra di progresso */}
          {totalCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                padding: "8px 12px",
                background: "rgba(0,0,0,0.25)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ flex: 1, height: 5, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(doneCount / totalCount) * 100}%`,
                    background: allDone
                      ? "linear-gradient(90deg,#10b981,#059669)"
                      : "linear-gradient(90deg,#d946ef,#9333ea)",
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: allDone ? "#10b981" : "#a1a1aa", whiteSpace: "nowrap" }}>
                {allDone ? "✓ TUTTE COMPLETATE" : `${doneCount} / ${totalCount} fatte`}
              </span>
              {(doneCount > 0 || skipped.size > 0) && (
                <button
                  onClick={resetAll}
                  style={{ fontSize: 10, color: "#71717a", background: "none", border: "1px solid #3f3f46", cursor: "pointer", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}
                >
                  Reset
                </button>
              )}
              {typeof Notification !== "undefined" && sections.some((s) => parseTimeMins(s.body) !== null) && (
                <button
                  onClick={handleNotifToggle}
                  title={
                    notifGranted === "denied"
                      ? "Notifiche bloccate dal browser — abilitale nelle impostazioni"
                      : notifOn && notifGranted === "granted"
                      ? "Notifiche attive — clicca per disattivare"
                      : "Clicca per attivare i promemoria agli orari del piano"
                  }
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: `1px solid ${notifOn && notifGranted === "granted" ? "#d946ef" : "#3f3f46"}`,
                    background: notifOn && notifGranted === "granted" ? "rgba(217,70,239,0.12)" : "rgba(255,255,255,0.03)",
                    color: notifOn && notifGranted === "granted" ? "#e879f9" : "#52525b",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: notifGranted === "denied" ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    opacity: notifGranted === "denied" ? 0.45 : 1,
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>
                    {notifOn && notifGranted === "granted" ? "🔔" : "🔕"}
                  </span>
                  <span>
                    {notifGranted === "denied"
                      ? "Bloccate"
                      : notifOn && notifGranted === "granted"
                      ? "Notifiche ON"
                      : "Attiva notifiche"}
                  </span>
                  {/* toggle visivo */}
                  <span
                    style={{
                      display: "inline-flex",
                      width: 28,
                      height: 15,
                      borderRadius: 999,
                      background: notifOn && notifGranted === "granted" ? "#d946ef" : "#3f3f46",
                      alignItems: "center",
                      padding: "0 2px",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: "#fff",
                        transform: notifOn && notifGranted === "granted" ? "translateX(13px)" : "translateX(0px)",
                        transition: "transform 0.2s",
                        display: "block",
                      }}
                    />
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Fallback: nessuna sezione */}
          {totalCount === 0 && intro.trim() && (
            <div style={{ marginBottom: 16 }}>
              <RenderOutput text={intro} />
            </div>
          )}

          {/* Sezioni PUBBLICAZIONE */}
          {sections.map((sec, idx) => {
            const isDone = done.has(idx);
            const isSkipped = skipped.has(idx);
            const isNext = idx === nextIdx && !isDone && !isSkipped;
            const fields = extractCopyFields(sec.body);
            // 🔴 da fare | 🟡 in scadenza | 🟢 fatto | 🟠 saltata
            const accentCol = isSkipped ? "#f97316" : isDone ? "#22c55e" : isNext ? "#fbbf24" : "#ef4444";
            return (
              <div
                key={idx}
                style={{
                  position: "relative",
                  marginBottom: 14,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${accentCol}55`,
                  borderLeft: `4px solid ${accentCol}`,
                  background: isSkipped ? "rgba(24,24,27,0.4)" : isDone ? "rgba(34,197,94,0.04)" : isNext ? "rgba(251,191,36,0.04)" : "rgba(239,68,68,0.04)",
                  transition: "all 0.3s ease",
                  boxShadow: isNext ? "0 0 12px 2px rgba(251,191,36,0.1)" : "none",
                  opacity: isSkipped ? 0.55 : 1,
                }}
              >
                {/* Badge ORA */}
                {isNext && (
                  <div style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    background: "rgba(251,191,36,0.18)",
                    border: "1px solid #fbbf24",
                    borderRadius: 6,
                    color: "#fbbf24",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    letterSpacing: "0.08em",
                    pointerEvents: "none",
                  }}>
                    📍 ORA
                  </div>
                )}

                <div style={{ padding: "12px 14px" }}>
                  {/* Titolo con pallino */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, opacity: isDone || isSkipped ? 0.45 : 1, transition: "opacity 0.3s" }}>
                    <span
                      style={{
                        flexShrink: 0, marginTop: 5, width: 9, height: 9, borderRadius: "50%",
                        background: accentCol,
                        boxShadow: `0 0 5px 2px ${accentCol}99`,
                        display: "inline-block", transition: "all 0.3s ease",
                      }}
                    />
                    <RenderOutput text={sec.title} />
                  </div>

                  {/* Corpo */}
                  <div style={{ opacity: isDone || isSkipped ? 0.18 : 1, transition: "opacity 0.3s", pointerEvents: isDone || isSkipped ? "none" : undefined }}>
                    <RenderOutput text={sec.body} />
                  </div>

                  {/* Bottoni copia */}
                  {!isDone && !isSkipped && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <CopyBtn text={fields.promptImg} label="Prompt Img" />
                      <CopyBtn text={fields.promptVideo} label="Prompt Video" />
                      <CopyBtn text={fields.canzone} label="Canzone" />
                      <CopyBtn text={fields.hook} label="Aggancio+pos." />
                      <CopyBtn text={fields.sondaggio} label="Sondaggio" />
                      <CopyBtn text={fields.fine} label="Fine+pos." />
                      <CopyBtn text={fields.captionHashtag} label="Caption+#" />
                      <CopyBtn text={fields.primoCommento} label="1° commento" />
                    </div>
                  )}

                  {/* Bottoni azione in basso a destra */}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {/* Bottone Focus */}
                    {!isSkipped && (
                      <button
                        onClick={() => setFocusIdx(idx)}
                        title="Focus Mode — schermo intero"
                        style={{
                          border: "1px solid rgba(217,70,239,0.25)",
                          background: "rgba(217,70,239,0.07)",
                          color: "#d946ef",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 8,
                          padding: "5px 10px",
                          cursor: "pointer",
                          letterSpacing: "0.03em",
                        }}
                      >
                        📱 Focus
                      </button>
                    )}
                    {/* Bottone Salta */}
                    <button
                      onClick={() => skipToggle(idx)}
                      title={isSkipped ? "Ripristina" : "Salta"}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        border: `2px solid ${isSkipped ? "#71717a" : "#f97316"}`,
                        background: isSkipped ? "rgba(113,113,122,0.1)" : "rgba(249,115,22,0.08)",
                        color: isSkipped ? "#71717a" : "#f97316",
                        fontSize: 13, fontWeight: 900, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.25s ease", lineHeight: 1, padding: 0,
                      }}
                    >
                      {isSkipped ? "↩" : "⏭"}
                    </button>
                    {/* Cerchio toggle fatto */}
                    <button
                      onClick={() => toggle(idx)}
                      title={isDone ? "Segna come da fare" : "Segna come fatto"}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        border: `2.5px solid ${isDone ? "#22c55e" : "#ef4444"}`,
                        background: isDone ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.10)",
                        color: isDone ? "#22c55e" : "#ef4444",
                        fontSize: 15, fontWeight: 900, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.25s ease",
                        boxShadow: isDone ? "0 0 8px 2px rgba(34,197,94,0.25)" : "0 0 8px 2px rgba(239,68,68,0.2)",
                        lineHeight: 1, padding: 0,
                      }}
                    >
                      {isDone ? "↩" : "✓"}
                    </button>
                  </div>
                </div>

                {isDone && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: 10, pointerEvents: "none", background: "repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(0,0,0,0.04) 12px,rgba(0,0,0,0.04) 24px)" }} />
                )}
              </div>
            );
          })}
        </>
      )}


      {/* ── TAB STRATEGIA ── */}
      {planTab === "strategia" && intro.trim() && (
        <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
          <RenderOutput text={intro} />
        </div>
      )}
    </div>
  );
}

/* ============================ Quick Notes Presets ============================ */

const QUICK_PRESETS = [
  { emoji: "🏋️", label: "Palestra", note: "Claudia si allena in palestra stamattina — activewear richiesto." },
  { emoji: "🍽️", label: "Cena fuori", note: "Cena fuori sera in ristorante — outfit elegante/glam." },
  { emoji: "🏠", label: "A casa", note: "Giornata a casa, non escirà. Location: interno appartamento Roma." },
  { emoji: "☕", label: "Caffè/colazione", note: "Colazione fuori al bar o brunch mattino — casual chic." },
  { emoji: "🛍️", label: "Shopping", note: "Claudia va a fare shopping — casual elegante, location centri commerciali o boutique Roma." },
  { emoji: "✈️", label: "Fuori Roma", note: "Claudia è fuori Roma oggi — location diversa dalla solita, considera lo spostamento." },
  { emoji: "💆", label: "Estetista", note: "Appuntamento estetista/manicure oggi — outfit comodo e facilmente accessibile." },
  { emoji: "🌙", label: "Serata evento", note: "Serata evento o uscita speciale — outfit glamour, sera." },
  { emoji: "🤒", label: "Non sta bene", note: "Claudia non sta benissimo — piani leggeri, contenuti da casa, no attività fisica." },
  { emoji: "📸", label: "Shoot dedicato", note: "Sessione foto/video dedicata oggi — più tempo per ogni contenuto, location curata." },
];

/* ============================ Planner Tab ============================ */

function PlannerTab(props: {
  date: string;
  setDate: (s: string) => void;
  dayNumber: string;
  setDayNumber: (s: string) => void;
  dayNumberLoading: boolean;
  weather: string;
  setWeather: (s: string) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  customNotes: string;
  setCustomNotes: (s: string) => void;
  weeklyGoal: string;
  setWeeklyGoal: (s: string) => void;
  generating: boolean;
  progress: number;
  stage: string;
  error: string | null;
  output: string;
  outputRef: RefObject<HTMLDivElement | null>;
  generate: () => void;
  stop: () => void;
  downloadOutput: () => void;
  mcsVersions: McsVersion[];
  elapsed: number;
  activePlan: HistoryItem | null;
  clearActivePlan: () => void;
}) {
  const {
    date,
    setDate,
    dayNumber,
    setDayNumber,
    weather,
    setWeather,
    settings,
    setSettings,
    customNotes,
    setCustomNotes,
    weeklyGoal,
    setWeeklyGoal,
    generating,
    progress,
    stage,
    error,
    output,
    outputRef,
    generate,
    stop,
    downloadOutput,
  } = props;

  const { elapsed, activePlan, clearActivePlan } = props;
  const lastMcs = props.mcsVersions[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {activePlan && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SectionTitle style={{ margin: 0 }}>
                  Piano del{" "}
                  {activePlan.date
                    ? new Date((activePlan.date || "").slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    : "—"}
                </SectionTitle>
                {!output && (
                  <span
                    title="Piano caricato dal cloud"
                    style={{ fontSize: 14, opacity: 0.5 }}
                  >
                    ☁
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
                {activePlan.weather} · {activePlan.pillarFocus} · {activePlan.platform}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigator.clipboard.writeText(activePlan.output)}
                style={ghostBtn}
              >
                Copia
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([activePlan.output], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `claudia-piano-${activePlan.date}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={ghostBtn}
              >
                Scarica .md
              </button>
              <button
                onClick={clearActivePlan}
                style={{
                  background: "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.2))",
                  border: "1px solid #10b981",
                  borderRadius: 8,
                  color: "#10b981",
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "6px 16px",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                ✓ FATTO — Archivia
              </button>
            </div>
          </div>
          <div ref={outputRef} style={{ ...outputBox, whiteSpace: "normal" }}>
            <ErrorBoundary>
              {activePlan.output ? (
                <PlanWithProgress text={activePlan.output} planId={activePlan.id} planDate={activePlan.date} />
              ) : (
                <div style={{ color: "#52525b", fontSize: 13, padding: 16 }}>
                  Contenuto del piano non disponibile. Caricamento in corso o piano vuoto.
                </div>
              )}
            </ErrorBoundary>
          </div>
        </Card>
      )}

      {lastMcs && (
        <div
          style={{
            background: "rgba(16,185,129,0.12)",
            border: "1px solid #10b981",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#10b981",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 14,
              flex: "0 0 auto",
            }}
          >
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              MCS attivo — {lastMcs.name}
            </div>
            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
              Ultimo aggiornamento:{" "}
              {new Date(lastMcs.savedAt).toLocaleString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>
      )}
      <Card>
        <SectionTitle>Parametri Giornata</SectionTitle>
        <div style={grid2}>
          <Field label="Data">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field
            label={
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                N° giorno registro
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    background: "rgba(255,0,255,0.15)",
                    color: "#ff00ff",
                    border: "1px solid rgba(255,0,255,0.3)",
                    borderRadius: 4,
                    padding: "1px 5px",
                    letterSpacing: "0.06em",
                  }}
                >
                  AUTO
                </span>
              </span>
            }
          >
            <input
              type="text"
              placeholder={props.dayNumberLoading ? "Calcolo in corso..." : "es. 12"}
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              disabled={props.dayNumberLoading}
              style={{
                ...inputStyle,
                opacity: props.dayNumberLoading ? 0.6 : 1,
              }}
            />
          </Field>
          <Field label="Meteo Roma">
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              style={inputStyle}
            >
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pillar focus">
            <select
              value={settings.pillarFocus}
              onChange={(e) =>
                setSettings({ ...settings, pillarFocus: e.target.value })
              }
              style={inputStyle}
            >
              {PILLAR_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Piattaforma">
            <select
              value={settings.platform}
              onChange={(e) =>
                setSettings({ ...settings, platform: e.target.value })
              }
              style={inputStyle}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Volume contenuti: ${settings.contentVolume}`}>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.contentVolume}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contentVolume: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </Field>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, marginBottom: 6 }}>
            Situazione rapida del giorno
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {QUICK_PRESETS.map((p) => {
              const active = customNotes.includes(p.note);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setCustomNotes(customNotes.replace(p.note, "").replace(/\n\n+/g, "\n").trim());
                    } else {
                      setCustomNotes(customNotes ? `${customNotes.trim()}\n${p.note}` : p.note);
                    }
                  }}
                  style={{
                    background: active ? "rgba(217,70,239,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active ? "#d946ef" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 20,
                    color: active ? "#e879f9" : "#a1a1aa",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.emoji} {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Note personalizzate del giorno (opzionale)">
          <textarea
            rows={3}
            placeholder="Eventi speciali, menzioni brand, location specifica..."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
          />
        </Field>

        <Field label={
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🎯 Obiettivo settimanale
            <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em" }}>AI</span>
          </span>
        }>
          <textarea
            rows={2}
            placeholder="es. Aumentare il reach Reels del 20% · Fare più contenuti lifestyle / meno hard sell · Spingere collabs brand X..."
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
            style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
          />
        </Field>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              ...primaryBtn,
              opacity: generating ? 0.5 : 1,
              cursor: generating ? "wait" : "pointer",
            }}
          >
            {generating
              ? "Generazione in corso..."
              : "GENERA PROGRAMMAZIONE COMPLETA"}
          </button>
        </div>
      </Card>

      {(generating || progress > 0) && (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 700 }}>
              {stage || "In corso..."}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {generating && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: elapsed >= 120 ? "#f59e0b" : "#71717a",
                  }}
                >
                  {elapsed >= 60
                    ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
                    : `${elapsed}s`}
                </span>
              )}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#ff00ff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {progress}%
              </span>
              {generating && (
                <button
                  onClick={stop}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✕ ANNULLA
                </button>
              )}
            </div>
          </div>
          <div style={progressTrack}>
            <div
              style={{
                ...progressBar,
                width: `${progress}%`,
              }}
            />
          </div>
        </Card>
      )}

      {error && (
        <Card style={{ borderColor: "#ef4444" }}>
          <div style={{ color: "#fca5a5", fontSize: 13 }}>
            <strong>Errore:</strong> {error}
          </div>
        </Card>
      )}

    </div>
  );
}

/* ============================ Editor Tab ============================ */

function SimpleEditor(props: {
  title: string;
  description: string;
  value: string;
  setValue: (s: string) => void;
  placeholder: string;
  uploadAccept: string;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  lockWhenFilled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const chars = props.value.length;
  const isLocked = props.lockWhenFilled && props.value.trim().length > 0;

  return (
    <Card>
      <SectionTitle>{props.title}</SectionTitle>
      <p style={{ color: "#a1a1aa", fontSize: 13, marginTop: 0 }}>
        {props.description}
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        {!isLocked && (
          <button onClick={() => fileRef.current?.click()} style={ghostBtn}>
            Carica file
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={props.uploadAccept}
          style={{ display: "none" }}
          onChange={props.onUpload}
        />
        {isLocked && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: "#10b981",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 999,
            padding: "3px 10px",
          }}>
            ✓ ATTIVO — Claude usa questi dati
          </span>
        )}
        {props.value && (
          <button
            onClick={() => {
              if (confirm("Vuoi cancellare il contenuto e inserirne uno nuovo?")) props.setValue("");
            }}
            style={{
              ...ghostBtn,
              color: "#f87171",
              borderColor: "rgba(248,113,113,0.35)",
            }}
          >
            🗑 Cancella
          </button>
        )}
        <span
          style={{
            marginLeft: "auto",
            color: "#71717a",
            fontSize: 11,
            alignSelf: "center",
          }}
        >
          {chars.toLocaleString("it-IT")} caratteri
        </span>
      </div>
      {isLocked ? (
        <div
          style={{
            ...inputStyle,
            minHeight: 380,
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 12,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            cursor: "default",
            color: "#a1a1aa",
            background: "rgba(0,0,0,0.35)",
            borderColor: "rgba(16,185,129,0.2)",
          }}
        >
          {props.value}
        </div>
      ) : (
        <textarea
          value={props.value}
          onChange={(e) => props.setValue(e.target.value)}
          placeholder={props.placeholder}
          style={{
            ...inputStyle,
            minHeight: 380,
            resize: "vertical",
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 12,
          }}
        />
      )}
    </Card>
  );
}

/* ============================ History Tab ============================ */

function HistoryTab(props: {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
  downloadHistoryItem: (it: HistoryItem) => void;
  mcs: string;
  restorePlan: (item: HistoryItem) => void;
  activePlanId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openContent, setOpenContent] = useState<string>("");
  const [dbItems, setDbItems] = useState<HistoryItem[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [contJobId, setContJobId] = useState<string | null>(null);
  const [contStatus, setContStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [contError, setContError] = useState<string | null>(null);
  const contPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [histSearch, setHistSearch] = useState("");

  function loadHistory() {
    setDbLoading(true);
    setDbError(null);
    apiFetch("/history/list")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setDbItems(data.items);
        setDbLoading(false);
      })
      .catch(() => {
        setDbError("Impossibile caricare la cronologia dal cloud.");
        setDbLoading(false);
      });
  }

  useEffect(() => {
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openPlan(id: string, localOutput?: string) {
    setContStatus("idle");
    setContError(null);
    setContJobId(null);
    if (contPollRef.current) {
      clearInterval(contPollRef.current);
      contPollRef.current = null;
    }
    if (localOutput) {
      setOpenId(id);
      setOpenContent(localOutput);
      return;
    }
    setOpenId(id);
    setOpenContent("Caricamento...");
    try {
      const r = await apiFetch(`/history/${id}`);
      const data = await r.json();
      setOpenContent(data.output || "(vuoto)");
    } catch {
      setOpenContent("Errore nel caricamento.");
    }
  }

  async function saveDate(id: string) {
    if (!editingDateValue) return;
    await apiFetch(`/history/${id}/date`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: editingDateValue }),
    }).catch(() => {});
    setDbItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, date: editingDateValue } : x)),
    );
    props.setHistory(
      props.history.map((x) => (x.id === id ? { ...x, date: editingDateValue } : x)),
    );
    setEditingDateId(null);
  }

  async function deletePlan(id: string) {
    if (!confirm("Eliminare questo piano?")) return;
    await apiFetch(`/history/${id}`, { method: "DELETE" }).catch(() => {});
    setDbItems((prev) => prev.filter((x) => x.id !== id));
    props.setHistory(props.history.filter((x) => x.id !== id));
    if (openId === id) setOpenId(null);
  }

  async function startContinuation() {
    if (!openContent || contStatus === "running") return;
    setContStatus("running");
    setContError(null);
    try {
      const r = await apiFetch("/plan/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truncatedPlan: openContent, mcsDocument: props.mcs }),
      });
      const data = await r.json();
      if (!data.jobId) throw new Error("Nessun jobId ricevuto");
      setContJobId(data.jobId);
      if (contPollRef.current) clearInterval(contPollRef.current);
      contPollRef.current = setInterval(async () => {
        try {
          const sr = await apiFetch(`/plan/status/${data.jobId}`);
          const sd = await sr.json();
          if (sd.status === "done") {
            clearInterval(contPollRef.current!);
            contPollRef.current = null;
            const completed = openContent + "\n" + sd.result;
            setOpenContent(completed);
            setContStatus("done");
            setContJobId(null);
            // Salva il piano completato nel DB
            if (openId) {
              apiFetch(`/history/${openId}/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ output: completed }),
              }).catch(() => {});
              props.setHistory(
                props.history.map((h) =>
                  h.id === openId ? { ...h, output: completed } : h,
                ),
              );
            }
          } else if (sd.status === "error") {
            clearInterval(contPollRef.current!);
            contPollRef.current = null;
            setContStatus("error");
            setContError(sd.error || "Errore generazione continuazione");
            setContJobId(null);
          }
        } catch {
          clearInterval(contPollRef.current!);
          contPollRef.current = null;
          setContStatus("error");
          setContError("Errore di connessione durante il polling");
          setContJobId(null);
        }
      }, 3000);
    } catch (e: unknown) {
      setContStatus("error");
      setContError(e instanceof Error ? e.message : "Errore avvio continuazione");
    }
  }

  function downloadItem(it: HistoryItem) {
    if (it.output) {
      props.downloadHistoryItem(it);
    } else {
      apiFetch(`/history/${it.id}`)
        .then((r) => r.json())
        .then((data) => {
          props.downloadHistoryItem({ ...it, output: data.output || "" });
        });
    }
  }

  // Merge DB + local, deduplica per id — local ha la precedenza (data esatta)
  const allIds = new Set<string>();
  const mergedAll: HistoryItem[] = [];
  for (const it of [...props.history, ...dbItems]) {
    if (!allIds.has(it.id)) {
      allIds.add(it.id);
      mergedAll.push(it);
    }
  }
  mergedAll.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const searchLower = histSearch.toLowerCase().trim();
  const merged = searchLower
    ? mergedAll.filter(
        (it) =>
          it.date.includes(searchLower) ||
          it.weather.toLowerCase().includes(searchLower) ||
          it.pillarFocus.toLowerCase().includes(searchLower) ||
          it.platform.toLowerCase().includes(searchLower) ||
          (it.output || "").toLowerCase().includes(searchLower),
      )
    : mergedAll;

  // Raggruppa per data
  const byDate: Record<string, HistoryItem[]> = {};
  for (const it of merged) {
    const d = it.date.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(it);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          background: "rgba(16,185,129,0.08)",
          border: "1px solid #10b981",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 12,
          color: "#10b981",
          fontWeight: 700,
        }}
      >
        <span>
          ☁ Cronologia sincronizzata con il cloud · {mergedAll.length} piani
          {dbLoading && (
            <span style={{ color: "#a1a1aa", fontWeight: 400 }}>
              {" "}— caricamento...
            </span>
          )}
          {dbError && (
            <span style={{ color: "#fca5a5", fontWeight: 400 }}> — {dbError}</span>
          )}
        </span>
        <button
          onClick={loadHistory}
          disabled={dbLoading}
          title="Ricarica storico dal cloud"
          style={{
            background: "none",
            border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 6,
            color: dbLoading ? "#4b5563" : "#10b981",
            cursor: dbLoading ? "not-allowed" : "pointer",
            fontSize: 14,
            padding: "2px 8px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            transition: "opacity 0.2s",
          }}
        >
          {dbLoading ? (
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                border: "2px solid #4b5563",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            "↻"
          )}
          <span style={{ fontSize: 11 }}>{dbLoading ? "..." : "Aggiorna"}</span>
        </button>
      </div>

      {/* Barra di ricerca */}
      {mergedAll.length > 0 && (
        <div style={{ position: "relative" }}>
          <input
            value={histSearch}
            onChange={(e) => setHistSearch(e.target.value)}
            placeholder="🔍  Cerca per data, meteo, pillar, piattaforma..."
            style={{
              ...inputStyle,
              paddingLeft: 14,
              fontSize: 12,
              background: "rgba(24,24,27,0.8)",
            }}
          />
          {histSearch && (
            <button
              onClick={() => setHistSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {mergedAll.length === 0 && !dbLoading && (
        <Card>
          <SectionTitle>Storico</SectionTitle>
          <p style={{ color: "#a1a1aa" }}>
            Nessun piano generato ancora. Vai su "Smart Planner" per crearne uno.
          </p>
        </Card>
      )}
      {mergedAll.length > 0 && merged.length === 0 && !dbLoading && (
        <Card>
          <p style={{ color: "#a1a1aa", margin: 0 }}>
            Nessun risultato per "<strong>{histSearch}</strong>".
          </p>
        </Card>
      )}

      {Object.entries(byDate).map(([date, items]) => (
        <div key={date}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#ff00ff",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            {new Date(date + "T12:00:00").toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          {items.map((it) => {
            const isOpen = openId === it.id;
            return (
              <Card key={it.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    {editingDateId === it.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <input
                          type="date"
                          value={editingDateValue}
                          onChange={(e) => setEditingDateValue(e.target.value)}
                          style={{
                            background: "#1c1c1f",
                            border: "1px solid #a855f7",
                            borderRadius: 6,
                            color: "#e4e4e7",
                            fontSize: 12,
                            padding: "3px 8px",
                          }}
                        />
                        <button
                          onClick={() => saveDate(it.id)}
                          style={{
                            background: "rgba(168,85,247,0.2)",
                            border: "1px solid #a855f7",
                            borderRadius: 6,
                            color: "#d8b4fe",
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Salva
                        </button>
                        <button
                          onClick={() => setEditingDateId(null)}
                          style={{
                            background: "none",
                            border: "1px solid #3f3f46",
                            borderRadius: 6,
                            color: "#71717a",
                            fontSize: 11,
                            padding: "3px 8px",
                            cursor: "pointer",
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 13,
                          color: "#f0abfc",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        Piano del{" "}
                        {new Date(it.date.slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        <button
                          onClick={() => {
                            setEditingDateId(it.id);
                            setEditingDateValue(it.date.slice(0, 10));
                          }}
                          title="Correggi data"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#71717a",
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <div style={{ fontWeight: 600, fontSize: 11, color: "#a1a1aa", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{it.weather} · {it.pillarFocus} · {it.platform}</span>
                      {(() => {
                        const total = Number(localStorage.getItem(`claudia.total.${it.id}`) ?? 0);
                        const doneArr: number[] = (() => { try { return JSON.parse(localStorage.getItem(`claudia.progress.${it.id}`) ?? "[]"); } catch { return []; } })();
                        const done = doneArr.length;
                        if (total === 0) return null;
                        const allD = done === total;
                        return (
                          <span style={{ background: allD ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${allD ? "#10b981" : "rgba(255,255,255,0.1)"}`, borderRadius: 5, color: allD ? "#10b981" : "#a1a1aa", fontSize: 10, fontWeight: 800, padding: "2px 7px", whiteSpace: "nowrap" }}>
                            {allD ? "✓ TUTTO FATTO" : `${done}/${total} fatte`}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>
                      Creato il: {new Date(it.createdAt).toLocaleString("it-IT")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {props.activePlanId === it.id ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#10b981",
                          border: "1px solid #10b981",
                          borderRadius: 6,
                          padding: "3px 8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ IN USO
                      </span>
                    ) : (
                      <button
                        disabled={restoringId === it.id}
                        onClick={async () => {
                          setRestoringId(it.id);
                          try {
                            let fullItem = it;
                            if (!it.output || it.output.length < 50) {
                              const r = await apiFetch(`/history/${it.id}`);
                              if (!r.ok) throw new Error(`HTTP ${r.status}`);
                              const data = await r.json();
                              fullItem = { ...it, output: data.output || it.output || "" };
                            }
                            props.restorePlan(fullItem);
                          } catch {
                            alert("Errore nel caricare il piano. Riprova.");
                          } finally {
                            setRestoringId(null);
                          }
                        }}
                        style={{
                          background: restoringId === it.id ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.4)",
                          borderRadius: 6,
                          color: "#10b981",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 10px",
                          cursor: restoringId === it.id ? "wait" : "pointer",
                          whiteSpace: "nowrap",
                          opacity: restoringId === it.id ? 0.6 : 1,
                        }}
                      >
                        {restoringId === it.id ? "⏳ Carico…" : "↩ Ripristina"}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        isOpen
                          ? setOpenId(null)
                          : openPlan(it.id, it.output || undefined)
                      }
                      style={ghostBtn}
                    >
                      {isOpen ? "Chiudi" : "Apri"}
                    </button>
                    <button onClick={() => downloadItem(it)} style={ghostBtn}>
                      ⤓
                    </button>
                    <button
                      onClick={() => deletePlan(it.id)}
                      style={{ ...ghostBtn, color: "#fca5a5" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={startContinuation}
                        disabled={contStatus === "running"}
                        style={{
                          background:
                            contStatus === "running"
                              ? "rgba(168,85,247,0.15)"
                              : "linear-gradient(135deg,rgba(255,0,255,0.18),rgba(192,38,211,0.18))",
                          border: "1px solid rgba(255,0,255,0.45)",
                          borderRadius: 8,
                          color: contStatus === "running" ? "#a78bfa" : "#f0abfc",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "6px 14px",
                          cursor: contStatus === "running" ? "not-allowed" : "pointer",
                          letterSpacing: "0.06em",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {contStatus === "running" ? (
                          <>
                            <span
                              style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                border: "2px solid #a78bfa",
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                            COMPLETAMENTO IN CORSO...
                          </>
                        ) : contStatus === "done" ? (
                          "✓ PIANO COMPLETATO"
                        ) : (
                          "↩ COMPLETA PIANO TRONCATO"
                        )}
                      </button>
                      {contStatus === "done" && (
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                          Piano completato e salvato.
                        </span>
                      )}
                      {contStatus === "error" && (
                        <span style={{ fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>
                          Errore: {contError}
                        </span>
                      )}
                    </div>
                    <div style={{ ...outputBox, whiteSpace: "normal" }}>
                      {openContent === "Caricamento..." ? (
                        <div style={{ color: "#71717a", fontSize: 12, textAlign: "center", padding: 20 }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: 16,
                              height: 16,
                              border: "2px solid #a855f7",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                              verticalAlign: "middle",
                              marginRight: 8,
                            }}
                          />
                          Caricamento piano...
                        </div>
                      ) : openContent === "Errore nel caricamento." ? (
                        <div style={{ color: "#fca5a5", fontSize: 12, padding: 12 }}>
                          ⚠ Impossibile caricare il piano. Riprova.
                        </div>
                      ) : !openContent || openContent === "(vuoto)" ? (
                        <div style={{ color: "#52525b", fontSize: 12, padding: 12 }}>
                          Piano non disponibile.
                        </div>
                      ) : (
                        <ErrorBoundary fallback={<div style={{ color: "#fca5a5", fontSize: 12, padding: 12 }}>⚠ Errore nel rendering. Usa ↩ Ripristina per aprire nel Planner.</div>}>
                          <RenderOutput text={openContent} />
                        </ErrorBoundary>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ============================ Stats Tab ============================ */

function StatsTab({ history }: { history: HistoryItem[] }) {
  const today = new Date();
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const last7: { date: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    last7.push({
      date: iso,
      label: d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }),
    });
  }

  const byDate: Record<string, HistoryItem[]> = {};
  for (const it of history) {
    const d = (it.date || "").slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(it);
  }

  let globalTotal = 0;
  let globalDone = 0;
  for (const it of history) {
    const total = Number(localStorage.getItem(`claudia.total.${it.id}`) ?? 0);
    const doneArr: number[] = (() => {
      try { return JSON.parse(localStorage.getItem(`claudia.progress.${it.id}`) ?? "[]"); }
      catch { return []; }
    })();
    globalTotal += total;
    globalDone += doneArr.length;
  }

  // Calendario mensile
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calStart = (firstDay + 6) % 7; // convert to Mon-start
  const calDays: (number | null)[] = [
    ...Array(calStart).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calDays.length % 7 !== 0) calDays.push(null);

  function dayColor(dayNum: number): { bg: string; border: string; text: string } {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const items = byDate[iso] ?? [];
    if (items.length === 0) return { bg: "transparent", border: "rgba(255,255,255,0.05)", text: "#52525b" };
    const total = items.reduce((s, it) => s + Number(localStorage.getItem(`claudia.total.${it.id}`) ?? 0), 0);
    const done = items.reduce((s, it) => {
      try { return s + (JSON.parse(localStorage.getItem(`claudia.progress.${it.id}`) ?? "[]") as number[]).length; }
      catch { return s; }
    }, 0);
    if (total === 0) return { bg: "rgba(217,70,239,0.08)", border: "rgba(217,70,239,0.2)", text: "#e879f9" };
    const pct = done / total;
    if (pct >= 1) return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10b981" };
    if (pct > 0) return { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" };
    return { bg: "rgba(217,70,239,0.06)", border: "rgba(217,70,239,0.15)", text: "#d946ef" };
  }

  // Analisi hashtag
  const hashFreq: Record<string, number> = {};
  for (const it of history) {
    const tags = (it.output || "").match(/#[\w\u00C0-\u017E]+/g) ?? [];
    for (const t of tags) {
      const k = t.toLowerCase();
      hashFreq[k] = (hashFreq[k] ?? 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const maxFreq = topHashtags[0]?.[1] ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Riepilogo globale */}
      <Card>
        <SectionTitle>📊 Riepilogo Totale</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Piani totali", value: history.length, color: "#e879f9" },
            { label: "Pubblicazioni tracciate", value: globalTotal, color: "#60a5fa" },
            { label: "Pubblicate ✓", value: globalDone, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
            </div>
          ))}
        </div>
        {globalTotal > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#a1a1aa", marginBottom: 4 }}>
              <span>Completamento totale</span>
              <span style={{ fontWeight: 800, color: "#22c55e" }}>{Math.round((globalDone / globalTotal) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(globalDone / globalTotal) * 100}%`, background: "linear-gradient(90deg,#22c55e,#10b981)", borderRadius: 3, transition: "width 0.4s" }} />
            </div>
          </div>
        )}
      </Card>

      {/* Calendario mensile */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <SectionTitle style={{ margin: 0 }}>🗓️ Calendario</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCalMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#a1a1aa", cursor: "pointer", padding: "2px 8px", fontSize: 14 }}>‹</button>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#e4e4e7", minWidth: 100, textAlign: "center" }}>
              {calMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setCalMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })} disabled={month >= today.getMonth() && year >= today.getFullYear()} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#a1a1aa", cursor: "pointer", padding: "2px 8px", fontSize: 14, opacity: month >= today.getMonth() && year >= today.getFullYear() ? 0.3 : 1 }}>›</button>
          </div>
        </div>
        {/* Header giorni settimana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3 }}>
          {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((g) => (
            <div key={g} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.04em", padding: "3px 0" }}>{g}</div>
          ))}
        </div>
        {/* Griglia giorni */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {calDays.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />;
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const col = dayColor(d);
            return (
              <div key={d} style={{
                aspectRatio: "1",
                borderRadius: 6,
                background: col.bg,
                border: `1px solid ${isToday ? "#d946ef" : col.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: isToday ? 900 : 700,
                color: isToday ? "#e879f9" : col.text,
                boxShadow: isToday ? "0 0 0 1px #d946ef" : "none",
                transition: "all 0.2s",
              }}>
                {d}
              </div>
            );
          })}
        </div>
        {/* Legenda */}
        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { color: "#10b981", label: "100% completato" },
            { color: "#fbbf24", label: "Parziale" },
            { color: "#d946ef", label: "Piano senza tracciamento" },
            { color: "#52525b", label: "Nessun piano" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 9, color: "#71717a" }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Analisi hashtag */}
      {topHashtags.length > 0 && (
        <Card>
          <SectionTitle>#️⃣ Top hashtag usati</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {topHashtags.map(([tag, count], i) => (
              <div key={tag} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#71717a", minWidth: 18, textAlign: "right" }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: "#e4e4e7", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag}</span>
                    <span style={{ fontSize: 10, color: "#71717a", marginLeft: 8, flexShrink: 0 }}>{count}x</span>
                  </div>
                  <div style={{ height: 3, background: "#27272a", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / maxFreq) * 100}%`, background: "linear-gradient(90deg,#d946ef,#9333ea)", borderRadius: 2 }} />
                  </div>
                </div>
                <CopyBtn text={tag} label="" />
              </div>
            ))}
          </div>
          {history.some(it => it.output.length < 200) && (
            <p style={{ fontSize: 10, color: "#52525b", marginTop: 8 }}>
              * Risultati più accurati man mano che apri i piani dallo storico.
            </p>
          )}
        </Card>
      )}

      {/* Ultimi 7 giorni */}
      <Card>
        <SectionTitle>📅 Ultimi 7 giorni</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {last7.map(({ date, label }) => {
            const items = byDate[date] ?? [];
            const hasPlan = items.length > 0;
            const totals = items.map((it) => Number(localStorage.getItem(`claudia.total.${it.id}`) ?? 0));
            const dones = items.map((it) => {
              try { return (JSON.parse(localStorage.getItem(`claudia.progress.${it.id}`) ?? "[]") as number[]).length; }
              catch { return 0; }
            });
            const dayTotal = totals.reduce((a, b) => a + b, 0);
            const dayDone = dones.reduce((a, b) => a + b, 0);
            const pct = dayTotal > 0 ? Math.round((dayDone / dayTotal) * 100) : null;

            return (
              <div
                key={date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  background: hasPlan ? "rgba(255,255,255,0.03)" : "transparent",
                  borderRadius: 8,
                  border: `1px solid ${hasPlan ? "rgba(255,255,255,0.07)" : "transparent"}`,
                  opacity: hasPlan ? 1 : 0.4,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", minWidth: 80 }}>{label}</span>
                {hasPlan ? (
                  <>
                    <div style={{ flex: 1, height: 5, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct ?? 0}%`, background: pct === 100 ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#d946ef,#9333ea)", borderRadius: 3, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? "#10b981" : "#a1a1aa", minWidth: 60, textAlign: "right" }}>
                      {pct !== null ? `${dayDone}/${dayTotal} (${pct}%)` : `${items.length} piano${items.length > 1 ? "i" : ""}`}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "#52525b" }}>Nessun piano</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================ Outfit Tab ============================ */

function OutfitTab({ history }: { history: HistoryItem[] }) {
  type OutfitEntry = { date: string; outfits: string[] };

  const entries: OutfitEntry[] = [];
  for (const item of history) {
    const raw = localStorage.getItem(`claudia.outfits.${item.id}`);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as OutfitEntry;
      if (parsed.outfits?.length) entries.push(parsed);
    } catch {
      // skip
    }
  }
  entries.sort((a, b) => (b.date > a.date ? 1 : -1));

  const allOutfits = entries.flatMap((e) => e.outfits);
  const freq: Record<string, number> = {};
  for (const o of allOutfits) {
    const key = o.toLowerCase().slice(0, 40);
    freq[key] = (freq[key] ?? 0) + 1;
  }
  const topOutfits = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {topOutfits.length > 0 && (
        <Card>
          <SectionTitle>Outfit più ricorrenti</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topOutfits.map((o, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(217,70,239,0.06)", border: "1px solid rgba(217,70,239,0.12)", borderRadius: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#d946ef", minWidth: 22 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, color: "#e4e4e7", flex: 1, textTransform: "capitalize" }}>{o}</span>
                <span style={{ fontSize: 10, color: "#71717a" }}>{freq[o]}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Storico outfit per data</SectionTitle>
        {entries.length === 0 ? (
          <p style={{ color: "#52525b", fontSize: 12 }}>
            Nessun outfit registrato. Gli outfit vengono estratti automaticamente quando apri un piano salvato con il testo "Outfit:" al suo interno.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((e, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", marginBottom: 8, letterSpacing: "0.05em" }}>
                  {new Date((e.date || "").slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {e.outfits.map((o, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: "#d946ef", fontSize: 11, marginTop: 2 }}>▸</span>
                      <span style={{ fontSize: 12, color: "#e4e4e7", lineHeight: 1.4 }}>{o}</span>
                      <CopyBtn text={o} label="" style={{ marginLeft: "auto", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================ Files Tab ============================ */

function FilesTab(props: {
  images: ImageRef[];
  setImages: Dispatch<SetStateAction<ImageRef[]>>;
  mcs: string;
  setMcs: (s: string) => void;
  references: string;
  setReferences: (s: string) => void;
}) {
  const imgRef = useRef<HTMLInputElement | null>(null);
  const txtRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState<"mcs" | "references">("mcs");

  async function handleImages(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const dataUrl = await resizeImage(f, 1024, 0.85);
        props.setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: f.name,
            dataUrl,
          },
        ]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleText(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    if (target === "mcs") {
      const merged = props.mcs ? props.mcs + "\n\n" + txt : txt;
      props.setMcs(merged);
    } else {
      const merged = props.references
        ? props.references + "\n\n" + txt
        : txt;
      props.setReferences(merged);
    }
    e.target.value = "";
    alert(`Caricato in ${target === "mcs" ? "MCS / DNA" : "Referenze"}.`);
  }

  function removeImage(id: string) {
    props.setImages((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle>Immagini di Riferimento</SectionTitle>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginTop: 0 }}>
          Carica foto reali della persona. L'AI le vedrà in fase di
          generazione per rendere i prompt più aderenti. Massimo 6 immagini
          inviate per piano (le prime 6).
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => imgRef.current?.click()}
            style={primaryBtn}
            disabled={uploading}
          >
            {uploading ? "Caricamento..." : "+ Carica immagini"}
          </button>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleImages}
          />
        </div>
        {props.images.length === 0 ? (
          <div
            style={{
              padding: 24,
              border: "1px dashed #3f3f46",
              borderRadius: 12,
              textAlign: "center",
              color: "#71717a",
              fontSize: 12,
            }}
          >
            Nessuna immagine caricata
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 8,
            }}
          >
            {props.images.map((img, i) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `2px solid ${i < 6 ? "#10b981" : "#3f3f46"}`,
                  aspectRatio: "1",
                  background: "#09090b",
                }}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {i < 6 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      background: "#10b981",
                      color: "white",
                      fontSize: 9,
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontWeight: 800,
                    }}
                  >
                    AI
                  </span>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Carica file di testo</SectionTitle>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginTop: 0 }}>
          Carica un .txt o .md (es. il documento MCS) e scegli dove
          aggiungerlo.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={target}
            onChange={(e) =>
              setTarget(e.target.value as "mcs" | "references")
            }
            style={{ ...inputStyle, maxWidth: 200 }}
          >
            <option value="mcs">→ MCS / DNA</option>
            <option value="references">→ Referenze</option>
          </select>
          <button
            onClick={() => txtRef.current?.click()}
            style={ghostBtn}
          >
            Carica file
          </button>
          <input
            ref={txtRef}
            type="file"
            accept=".txt,.md,.json"
            style={{ display: "none" }}
            onChange={handleText}
          />
        </div>
      </Card>
    </div>
  );
}

async function resizeImage(
  file: File,
  maxSide: number,
  quality: number,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  if (ratio === 1 && file.size < 800_000) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/* ============================ Chat MCS Tab ============================ */

function ChatTab(props: {
  mcs: string;
  setMcs: (s: string) => void;
  mcsVersions: McsVersion[];
  setMcsVersions: Dispatch<SetStateAction<McsVersion[]>>;
  chatMsgs: ChatMsg[];
  setChatMsgs: Dispatch<SetStateAction<ChatMsg[]>>;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  function cancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setBusy(false);
    setStage("Annullato");
    setStreaming("");
    setError("Operazione annullata dall'utente");
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [props.chatMsgs, streaming]);

  async function send() {
    const instruction = input.trim();
    if (!instruction || busy) return;
    setError(null);
    setInput("");
    setStreaming("");
    setProgress(0);
    setStage("Avvio...");
    setBusy(true);

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: instruction,
      at: new Date().toISOString(),
    };
    props.setChatMsgs((prev) => [...prev, userMsg]);

    let attempt = 0;
    while (true) {
      attempt += 1;
      const result = await runEditOnce(instruction, attempt);
      if (result === "ok" || result === "manual-abort") break;
      if (attempt === 1) {
        setStage("Timeout — riprovo automaticamente...");
        setError(null);
        setProgress(0);
        setStreaming("");
        continue;
      }
      const choice = window.confirm(
        "Anche il secondo tentativo è andato in timeout dopo 30 secondi.\n\nOK = Riprova ancora\nAnnulla = Ferma e mostra errore",
      );
      if (choice) {
        setStage("Nuovo tentativo...");
        setError(null);
        setProgress(0);
        setStreaming("");
        continue;
      }
      setError(
        "Timeout: nessuna risposta per 30 secondi (2 tentativi falliti). Riprova quando vuoi.",
      );
      setStage("Timeout");
      break;
    }
    abortRef.current = null;
    setBusy(false);
  }

  async function runEditOnce(
    instruction: string,
    attempt: number,
  ): Promise<"ok" | "timeout" | "manual-abort"> {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let timedOut = false;
    setStage(attempt > 1 ? `Tentativo ${attempt}...` : "Avvio...");

    try {
      // 1) Avvia il job
      const startRes = await apiFetch("/mcs/edit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcs: props.mcs, instruction }),
        signal: ac.signal,
      });
      if (!startRes.ok) throw new Error(`HTTP ${startRes.status}`);
      const { jobId } = await startRes.json() as { jobId: string };

      setProgress(10);
      setStage("Claude sta riscrivendo l'MCS…");

      // 2) Polling finché non è done o error
      const POLL_INTERVAL = 2000;
      const TIMEOUT_MS = 5 * 60 * 1000;
      const deadline = Date.now() + TIMEOUT_MS;
      let dots = 0;

      let finalText = "";
      while (true) {
        if (ac.signal.aborted) {
          timedOut = Date.now() >= deadline;
          return timedOut ? "timeout" : "manual-abort";
        }
        if (Date.now() >= deadline) {
          timedOut = true;
          ac.abort();
          return "timeout";
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL));

        const pollRes = await apiFetch(`/mcs/edit/status/${jobId}`, {
          signal: ac.signal,
        });
        if (!pollRes.ok) throw new Error(`Poll HTTP ${pollRes.status}`);
        const data = await pollRes.json() as {
          status: string;
          result?: string;
          error?: string;
        };

        if (data.status === "error") throw new Error(data.error || "Errore generazione");
        if (data.status === "done") {
          finalText = (data.result || "").trim();
          break;
        }

        // Pending: aggiorna UI con animazione puntini
        dots = (dots + 1) % 4;
        setStage("Claude sta riscrivendo" + ".".repeat(dots + 1));
        setProgress(Math.min(85, 10 + Math.floor((Date.now() - (deadline - TIMEOUT_MS)) / 1500)));
      }

      if (!finalText) throw new Error("Risposta vuota");

      const now = new Date();
      const stamp = now
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(":", "-");
      const versionId = `v-${Date.now()}`;
      const version: McsVersion = {
        id: versionId,
        name: `MCS_${stamp}.md`,
        savedAt: now.toISOString(),
        content: finalText,
        reason: instruction,
      };
      props.setMcsVersions((prev) => [version, ...prev]);
      props.setMcs(finalText);

      const assistantMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `MCS aggiornato e salvato come ${version.name} (${finalText.length.toLocaleString("it-IT")} caratteri). La modifica sarà attiva nella prossima generazione.`,
        versionId,
        at: new Date().toISOString(),
      };
      props.setChatMsgs((prev) => [...prev, assistantMsg]);
      setStreaming("");
      setProgress(100);
      setStage("Completato");
      return "ok";
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        if (timedOut) return "timeout";
        setStage("Annullato");
        return "manual-abort";
      }
      setError(err instanceof Error ? err.message : "Errore");
      return "manual-abort";
    }
  }

  function restoreVersion(v: McsVersion) {
    if (!confirm(`Ripristinare ${v.name} come MCS attivo?`)) return;
    props.setMcs(v.content);
    alert("MCS ripristinato.");
  }

  function downloadVersion(v: McsVersion) {
    const blob = new Blob([v.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = v.name.replace(/\.md$/, ".txt");
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearChat() {
    if (!confirm("Cancellare tutta la cronologia chat?")) return;
    props.setChatMsgs([]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {props.mcsVersions.length > 0 && (
        <div
          style={{
            background: "rgba(16,185,129,0.12)",
            border: "1px solid #10b981",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#10b981",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 14,
              flex: "0 0 auto",
            }}
          >
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              MCS aggiornato — {props.mcsVersions[0].name}
            </div>
            <div
              style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}
            >
              Ultimo aggiornamento:{" "}
              {new Date(props.mcsVersions[0].savedAt).toLocaleString(
                "it-IT",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                },
              )}
            </div>
          </div>
          <button
            onClick={() => downloadVersion(props.mcsVersions[0])}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #10b981",
              background: "rgba(16,185,129,0.15)",
              color: "#10b981",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
            }}
          >
            ⬇ Scarica .md
          </button>
        </div>
      )}
      {props.mcsVersions.length === 0 && props.mcs.trim() && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              const blob = new Blob([props.mcs], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "MCS_claudia.md";
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #3f3f46",
              background: "rgba(255,255,255,0.04)",
              color: "#a1a1aa",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            ⬇ Scarica MCS .md
          </button>
        </div>
      )}

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <SectionTitle style={{ margin: 0 }}>
            Chat — Modifica MCS in linguaggio naturale
          </SectionTitle>
          {props.chatMsgs.length > 0 && (
            <button onClick={clearChat} style={ghostBtn}>
              Pulisci
            </button>
          )}
        </div>
        <p style={{ color: "#a1a1aa", fontSize: 12, marginTop: 0 }}>
          Scrivi cosa modificare nell'MCS (es. "aggiungi regola: mai
          stivali con cinturino sopra il polpaccio" oppure "togli il
          riferimento al pillar P5"). L'AI riscriverà il documento e
          salverà una nuova versione con data e ora. Sarà usato dalla
          prossima generazione.
        </p>
        <div
          ref={scrollRef}
          style={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 12,
            padding: 12,
            maxHeight: 400,
            minHeight: 200,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {props.chatMsgs.length === 0 && !streaming && (
            <div style={{ color: "#52525b", fontSize: 12, padding: 12 }}>
              Nessun messaggio. Scrivi qui sotto la modifica da fare
              all'MCS.
            </div>
          )}
          {props.chatMsgs.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? "#7c3aed" : "#27272a",
                color: "white",
                padding: "8px 12px",
                borderRadius: 12,
                fontSize: 13,
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
              }}
            >
              {m.content}
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 4,
                }}
              >
                {new Date(m.at).toLocaleString("it-IT")}
              </div>
            </div>
          ))}
          {streaming && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                background: "#27272a",
                color: "#a1a1aa",
                padding: "8px 12px",
                borderRadius: 12,
                fontSize: 11,
                fontFamily: "ui-monospace, Menlo, monospace",
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {streaming.slice(-1500)}
            </div>
          )}
        </div>

        {busy && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 700 }}
              >
                {stage || "Elaborazione..."}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color:
                      elapsed >= 25
                        ? "#ef4444"
                        : elapsed >= 15
                          ? "#f59e0b"
                          : "#71717a",
                  }}
                >
                  {elapsed}s / 30s
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#ff00ff",
                    fontWeight: 800,
                  }}
                >
                  {progress}%
                </span>
                <button
                  onClick={cancel}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✕ ANNULLA
                </button>
              </div>
            </div>
            <div style={progressTrack}>
              <div style={{ ...progressBar, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              color: "#fca5a5",
              fontSize: 12,
              padding: 8,
              background: "rgba(239,68,68,0.1)",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            Errore: {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Es. 'Aggiungi nella sezione outfit la regola che con la pioggia mai sandali aperti, sempre stivali impermeabili'... (Ctrl+Invio per inviare)"
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontSize: 13,
              minHeight: 60,
            }}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            style={{
              ...primaryBtn,
              flex: "0 0 auto",
              padding: "0 20px",
              opacity: busy || !input.trim() ? 0.5 : 1,
            }}
          >
            {busy ? "..." : "INVIA"}
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Versioni MCS salvate</SectionTitle>
        {props.mcsVersions.length === 0 ? (
          <p style={{ color: "#71717a", fontSize: 12 }}>
            Nessuna versione ancora. Manda una modifica via chat per
            crearne una.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {props.mcsVersions.map((v) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  padding: "8px 12px",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      fontFamily: "ui-monospace, Menlo, monospace",
                    }}
                  >
                    {v.name}
                  </div>
                  {v.reason && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#a1a1aa",
                        marginTop: 2,
                      }}
                    >
                      "{v.reason.slice(0, 100)}
                      {v.reason.length > 100 ? "..." : ""}"
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: "#52525b",
                      marginTop: 2,
                    }}
                  >
                    {new Date(v.savedAt).toLocaleString("it-IT")} ·{" "}
                    {v.content.length.toLocaleString("it-IT")} car.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => restoreVersion(v)}
                    style={ghostBtn}
                  >
                    Ripristina
                  </button>
                  <button
                    onClick={() => downloadVersion(v)}
                    style={ghostBtn}
                  >
                    ⤓
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Eliminare questa versione?"))
                        props.setMcsVersions((prev) =>
                          prev.filter((x) => x.id !== v.id),
                        );
                    }}
                    style={{ ...ghostBtn, color: "#fca5a5" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================ Atoms ============================ */

function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

function SectionTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: "#a1a1aa",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginTop: 0,
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#71717a", fontWeight: 700 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({
  label,
  active,
  forceLabel,
}: {
  label: string;
  active: boolean;
  forceLabel?: string;
}) {
  const suffix = forceLabel ?? (active ? "✓" : "—");
  return (
    <span
      style={{
        fontSize: 10,
        padding: "4px 8px",
        borderRadius: 6,
        fontWeight: 800,
        letterSpacing: "0.05em",
        background: active ? "#10b981" : "#7c3aed",
        border: `1px solid ${active ? "#10b981" : "#7c3aed"}`,
        color: "white",
      }}
    >
      {label} {suffix}
    </span>
  );
}

/* ============================ Styles ============================ */

const shell: CSSProperties = {
  minHeight: "100vh",
  background: "#09090b",
  color: "#f4f4f5",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const headerStyle: CSSProperties = {
  padding: "20px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  borderBottom: "1px solid #18181b",
  background:
    "radial-gradient(ellipse at top left, rgba(255,0,255,0.08), transparent 60%)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  textTransform: "uppercase",
  background: "linear-gradient(90deg, #ff00ff, #aa00ff)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitleStyle: CSSProperties = {
  fontSize: 10,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  fontWeight: 700,
  marginTop: 4,
};

const badgesRow: CSSProperties = {
  display: "flex",
  gap: 6,
};

const tabsRow: CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "12px 16px",
  overflowX: "auto",
  borderBottom: "1px solid #18181b",
};

const mainStyle: CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: 16,
};

const cardStyle: CSSProperties = {
  background: "rgba(24,24,27,0.85)",
  border: "1px solid #27272a",
  borderRadius: 16,
  padding: 16,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "white",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const primaryBtn: CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  background: "linear-gradient(90deg, #ff00ff, #aa00ff)",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 900,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(255,0,255,0.25)",
};

const ghostBtn: CSSProperties = {
  padding: "8px 12px",
  background: "#27272a",
  color: "white",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

function tabBtn(active: boolean): CSSProperties {
  return {
    padding: "8px 14px",
    background: active ? "#27272a" : "transparent",
    color: active ? "white" : "#71717a",
    border: `1px solid ${active ? "#3f3f46" : "transparent"}`,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

const progressTrack: CSSProperties = {
  width: "100%",
  height: 10,
  background: "#18181b",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid #27272a",
};

const progressBar: CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #ff00ff, #aa00ff)",
  borderRadius: 999,
  transition: "width 0.25s ease",
  boxShadow: "0 0 10px rgba(255,0,255,0.5)",
};

const outputBox: CSSProperties = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: 12,
  padding: 16,
  fontFamily: "ui-monospace, Menlo, monospace",
  fontSize: 12,
  color: "#e4e4e7",
  whiteSpace: "pre-wrap",
  maxHeight: 600,
  overflowY: "auto",
  lineHeight: 1.6,
};
