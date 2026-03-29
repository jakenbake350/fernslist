import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, getBoardId, setBoardId } from "./supabase";

const PRIORITIES = ["🔴 urgent", "🟡 soon", "🟢 whenever"];
const CATEGORIES = ["printer", "business", "home", "health", "finance", "tech", "other"];
const P_ORDER = { "🔴 urgent": 0, "🟡 soon": 1, "🟢 whenever": 2 };

const SEED = [
  { id: 300, text: "STOCK UP on filament before April 8 price hikes", priority: "🔴 urgent", category: "business", done: false, created: "3/27/2026", subtasks: [
    { id: 301, text: "Tinmorry PETG-GF15 — bulk order, multiple colors for multicolor boxes", done: false },
    { id: 302, text: "PAHT-CF — grab a few rolls while still affordable", done: false },
    { id: 305, text: "Polymaker PET-GF — stock up at $30/roll (great finish, decent value)", done: false },
    { id: 306, text: "PPA-CF — watch for sales, almost out but don't panic-buy", done: false },
    { id: 303, text: "PPS-CF — stocked, skip", done: true },
    { id: 304, text: "PLA — lower priority, not oil-based but transport costs still rising", done: false },
  ]},
  { id: 100, text: "Q2C — SSH in, full config dump before any mods", priority: "🔴 urgent", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 101, text: "mesh diff Q2C vs Q2 configs", done: false },
    { id: 102, text: "check PSU wattage label", done: false },
    { id: 103, text: "check SSR footprint on X-9-3 mainboard", done: false },
    { id: 104, text: "check toolhead fan connector type", done: false },
  ]},
  { id: 110, text: "Q2C — Creality Nebula camera install", priority: "🟡 soon", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 111, text: "waiting on Molex Pico Blade cables", done: false },
    { id: 112, text: "wire camera to AP board 5-pin connector", done: false },
    { id: 113, text: "configure crowsnest / cam 2", done: false },
  ]},
  { id: 120, text: "Q2C — R3men 5015 part cooling fan swap", priority: "🟡 soon", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 121, text: "crimp connector (same wire order as Q2 swap)", done: false },
  ]},
  { id: 130, text: "Q2 — community wiki tweaks/mods", priority: "🟡 soon", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 131, text: "random Z home probe spot (no permanent dimple)", done: false },
    { id: 132, text: "macro changes — faster print start (currently ~12 min)", done: false },
    { id: 133, text: "translate working changes to Q2C after", done: false },
  ]},
  { id: 140, text: "Q2 — HULA feet / ShakeTune vibration testing", priority: "🟢 whenever", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 141, text: "test with/without F8-22 thrust bearings", done: false },
    { id: 142, text: "ShakeTune baseline on Q2", done: false },
    { id: 143, text: "same-gcode comparison print Q2 vs Q2C", done: false },
  ]},
  { id: 150, text: "X-Max 3 — Belt B replacement", priority: "🟡 soon", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 151, text: "2000mm GT2 10mm belt on hand", done: false },
    { id: 152, text: "low-effort final repair attempt", done: false },
  ]},
  { id: 160, text: "X-Max 3 — FreeDi firmware flash", priority: "🟢 whenever", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 161, text: "32GB eMMC card ready", done: false },
    { id: 162, text: "complete belt rebuild first", done: false },
  ]},
  { id: 170, text: "MMU Box — purge blob troubleshooting", priority: "🟢 whenever", category: "printer", done: false, created: "3/27/2026", subtasks: [
    { id: 171, text: "investigate nozzle wipe roller / E distance on unload", done: false },
    { id: 172, text: "apply anti-stick nozzle coating", done: false },
  ]},
  { id: 1, text: "organize garage", priority: "🟢 whenever", category: "home", done: false, created: "3/27/2026", subtasks: [
    { id: 11, text: "clean other bench", done: false },
    { id: 12, text: "clean off and put away finishing table", done: false },
    { id: 13, text: "disassemble big storage rack", done: false },
  ]},
  { id: 2, text: "disability reapplication (psych referral)", priority: "🔴 urgent", category: "finance", done: false, created: "3/27/2026", subtasks: [
    { id: 21, text: "reapply for disability", done: false },
    { id: 22, text: "talk with Gina about certification", done: false },
  ]},
  { id: 3, text: "CCW renewal — deadline April 15", priority: "🔴 urgent", category: "other", done: false, created: "3/27/2026", subtasks: [
    { id: 31, text: "gather scanned forms", done: false },
    { id: 32, text: "submit application on sheriff's website", done: false },
  ]},
  { id: 4, text: "build Fern's List as a real app", priority: "🟢 whenever", category: "tech", done: false, created: "3/27/2026", subtasks: [
    { id: 41, text: "React Native for Android", done: false },
    { id: 42, text: "Electron desktop app or browser version", done: false },
    { id: 43, text: "Node/Express backend for sync", done: false },
    { id: 44, text: "deploy backend free on Railway or Render", done: false },
  ]},
  { id: 200, text: "register fernfabrications.com", priority: "🟡 soon", category: "business", done: false, created: "3/27/2026", subtasks: [
    { id: 201, text: "Cloudflare Registrar ~$12/yr", done: false },
    { id: 202, text: "set up Zoho Mail free tier", done: false },
  ]},
  { id: 210, text: "business cards for gun club events", priority: "🟢 whenever", category: "business", done: false, created: "3/27/2026", subtasks: [] },
  { id: 220, text: "garage electrical — dead western wall outlets", priority: "🟡 soon", category: "home", done: false, created: "3/27/2026", subtasks: [
    { id: 221, text: "check for tripped GFCI first", done: false },
    { id: 222, text: "inspect outlet closest to sub panel", done: false },
  ]},
  { id: 230, text: "MCP server — migrate config to desktop machine", priority: "🟢 whenever", category: "tech", done: false, created: "3/27/2026", subtasks: [] },
];

function today() { return new Date().toLocaleDateString(); }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const TEXT_SIZES = { small: 11, medium: 14, large: 17 };
const THEMES = {
  dark: {
    bg: "#0f0f0f", surface: "#141414", surface2: "#181818",
    border: "#1e1e1e", border2: "#2a2a2a", border3: "#222",
    text: "#e8e8e0", textMuted: "#888", textDim: "#555", textFaint: "#3a3a3a",
    accent: "#f5a623", accentBg: "#140f00", accentText: "#000",
    inputBorder: "#333", subInputBorder: "#252525",
  },
  light: {
    bg: "#f5f0e8", surface: "#fffdf8", surface2: "#f0ebe0",
    border: "#d8d0c0", border2: "#c8c0b0", border3: "#ddd",
    text: "#1a1a14", textMuted: "#5a5248", textDim: "#8a8070", textFaint: "#b0a898",
    accent: "#c47d0a", accentBg: "#fff8ec", accentText: "#fff",
    inputBorder: "#b8b0a0", subInputBorder: "#ccc",
  },
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const [newTask, setNewTask] = useState("");
  const [newPri, setNewPri] = useState("🟡 soon");
  const [newCat, setNewCat] = useState("printer");
  const [filter, setFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [subInputs, setSubInputs] = useState({});
  const [checkIn, setCheckIn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("fern-theme") || "dark");
  const [textSize, setTextSize] = useState(() => localStorage.getItem("fern-text-size") || "medium");
  const [boardId] = useState(() => getBoardId());
  const [importId, setImportId] = useState("");
  const width = useWidth();
  const mobile = width < 700;
  const T = THEMES[theme];
  const TS = TEXT_SIZES[textSize];
  const boardRef = useRef(boardId);

  // Load tasks from Supabase
  useEffect(() => {
    async function load() {
      setSyncStatus("connecting");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("board_id", boardId);

      if (error) {
        setSyncStatus("error");
        setLoaded(true);
        return;
      }

      if (data && data.length > 0) {
        setTasks(data.map(r => ({ ...r, subtasks: r.subtasks || [] })));
      } else {
        // First time — seed the database
        const seeded = SEED.map(t => ({ ...t, board_id: boardId }));
        const { error: insertErr } = await supabase.from("tasks").insert(seeded);
        if (!insertErr) setTasks(SEED);
      }
      setSyncStatus("synced");
      setLoaded(true);
    }
    load();
  }, [boardId]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTasks(prev => prev.find(t => t.id === payload.new.id)
            ? prev
            : [...prev, { ...payload.new, subtasks: payload.new.subtasks || [] }]);
        } else if (payload.eventType === "UPDATE") {
          setTasks(prev => prev.map(t =>
            t.id === payload.new.id ? { ...payload.new, subtasks: payload.new.subtasks || [] } : t
          ));
        } else if (payload.eventType === "DELETE") {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
        setSyncStatus("synced");
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [boardId]);

  const upsertTask = useCallback(async (task) => {
    setSyncStatus("saving");
    const { error } = await supabase
      .from("tasks")
      .upsert({ ...task, board_id: boardRef.current });
    if (error) setSyncStatus("error");
    else setSyncStatus("synced");
  }, []);

  const deleteTask = useCallback(async (id) => {
    setSyncStatus("saving");
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("board_id", boardRef.current);
    if (error) setSyncStatus("error");
    else setSyncStatus("synced");
  }, []);

  const toggle = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const updated = { ...task, done: !task.done };
      upsertTask(updated);
      return prev.map(t => t.id === id ? updated : t);
    });
  }, [upsertTask]);

  const remove = useCallback((id) => {
    if (!confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteTask(id);
  }, [deleteTask]);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      priority: newPri,
      category: newCat,
      done: false,
      created: today(),
      subtasks: [],
    };
    setTasks(prev => [...prev, task]);
    upsertTask(task);
    setNewTask("");
    if (mobile) setPanelOpen(false);
  }, [newTask, newPri, newCat, mobile, upsertTask]);

  const toggleSub = useCallback((tid, sid) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === tid);
      if (!task) return prev;
      const updated = { ...task, subtasks: task.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) };
      upsertTask(updated);
      return prev.map(t => t.id === tid ? updated : t);
    });
  }, [upsertTask]);

  const removeSub = useCallback((tid, sid) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === tid);
      if (!task) return prev;
      const updated = { ...task, subtasks: task.subtasks.filter(s => s.id !== sid) };
      upsertTask(updated);
      return prev.map(t => t.id === tid ? updated : t);
    });
  }, [upsertTask]);

  const addSub = useCallback((tid) => {
    const text = (subInputs[tid] || "").trim();
    if (!text) return;
    setTasks(prev => {
      const task = prev.find(t => t.id === tid);
      if (!task) return prev;
      const updated = { ...task, subtasks: [...task.subtasks, { id: Date.now(), text, done: false }] };
      upsertTask(updated);
      return prev.map(t => t.id === tid ? updated : t);
    });
    setSubInputs(p => ({ ...p, [tid]: "" }));
  }, [subInputs, upsertTask]);

  const saveEdit = useCallback((id) => {
    if (!editText.trim()) { setEditingId(null); return; }
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const updated = { ...task, text: editText.trim() };
      upsertTask(updated);
      return prev.map(t => t.id === id ? updated : t);
    });
    setEditingId(null);
  }, [editText, upsertTask]);

  const changePri = useCallback((id, priority) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const updated = { ...task, priority };
      upsertTask(updated);
      return prev.map(t => t.id === id ? updated : t);
    });
  }, [upsertTask]);

  const changeCat = useCallback((id, category) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const updated = { ...task, category };
      upsertTask(updated);
      return prev.map(t => t.id === id ? updated : t);
    });
  }, [upsertTask]);

  const saveTheme = (t) => { setTheme(t); localStorage.setItem("fern-theme", t); };
  const saveTextSize = (s) => { setTextSize(s); localStorage.setItem("fern-text-size", s); };

  const handleImportId = () => {
    const trimmed = importId.trim();
    if (!trimmed) return;
    if (!confirm("Switch to a different board? Make sure you've saved your current board ID first.")) return;
    setBoardId(trimmed);
    window.location.reload();
  };

  const visible = tasks
    .filter(t => showDone ? true : !t.done)
    .filter(t => filter === "all" || t.category === filter)
    .sort((a, b) => P_ORDER[a.priority] - P_ORDER[b.priority]);

  const doneCount = tasks.filter(t => t.done).length;
  const openCount = tasks.length - doneCount;
  const focusTasks = tasks
    .filter(t => !t.done && (t.priority === "🔴 urgent" || t.priority === "🟡 soon"))
    .sort((a, b) => P_ORDER[a.priority] - P_ORDER[b.priority]);

  const syncDot = { synced: "#4caf50", saving: "#f5a623", connecting: "#888", error: "#e53935" }[syncStatus];
  const syncLabel = { synced: "synced", saving: "saving...", connecting: "connecting...", error: "sync error" }[syncStatus];

  const inputStyle = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${T.inputBorder}`, color: T.text,
    fontFamily: "'Courier New', monospace", fontSize: TS,
    padding: "6px 0 7px", outline: "none", marginBottom: 10, boxSizing: "border-box",
  };

  if (!loaded) return (
    <div style={{ color: T.textMuted, padding: 24, fontFamily: "'Courier New', monospace", background: T.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: T.accent }}>loading fern's list...</span>
    </div>
  );

  const sidebar = (
    <div style={{
      ...(mobile
        ? { padding: "12px 16px", borderBottom: `1px solid ${T.border}` }
        : { width: 230, flexShrink: 0, borderRight: `1px solid ${T.border}`, padding: "16px 14px", overflowY: "auto" }
      ),
      display: "flex", flexDirection: "column", gap: 4, background: T.bg,
    }}>
      <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginTop: 8, marginBottom: 4 }}>new task</div>
      <div style={{ background: T.surface, border: `1px solid ${T.border3}`, borderRadius: 5, padding: 12, marginBottom: 8 }}>
        <input
          style={inputStyle}
          placeholder="what needs doing..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <select style={{ background: T.bg, border: `1px solid ${T.border2}`, color: T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 2, padding: "6px", borderRadius: 4, cursor: "pointer", flex: 1, minWidth: 0 }}
            value={newPri} onChange={e => setNewPri(e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select style={{ background: T.bg, border: `1px solid ${T.border2}`, color: T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 2, padding: "6px", borderRadius: 4, cursor: "pointer", flex: 1, minWidth: 0 }}
            value={newCat} onChange={e => setNewCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          style={{ width: "100%", marginTop: 10, background: T.accent, border: "none", color: T.accentText, fontFamily: "'Courier New', monospace", fontWeight: "bold", fontSize: TS - 1, padding: "9px", borderRadius: 4, cursor: "pointer" }}
          onClick={addTask}>+ add task</button>
      </div>

      <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginTop: 8, marginBottom: 4 }}>filter</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {["all", ...CATEGORIES].map(c => (
          <button key={c}
            style={{ background: filter === c ? T.accentBg : "transparent", border: `1px solid ${filter === c ? T.accent : T.border}`, color: filter === c ? T.accent : T.textDim, fontFamily: "'Courier New', monospace", fontSize: TS - 3, padding: "6px 10px", borderRadius: 4, cursor: "pointer" }}
            onClick={() => setFilter(c)}>{c}</button>
        ))}
        <button
          style={{ background: showDone ? T.accentBg : "transparent", border: `1px dashed ${showDone ? T.accent : T.border}`, color: showDone ? T.accent : T.textDim, fontFamily: "'Courier New', monospace", fontSize: TS - 3, padding: "6px 10px", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setShowDone(!showDone)}>✓ done</button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: T.bg, color: T.text, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Check-in modal */}
      {checkIn && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={() => setCheckIn(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.accent}`, borderRadius: 8, padding: 22, width: "100%", maxWidth: mobile ? "95vw" : 480, boxSizing: "border-box", maxHeight: "85vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: TS + 4, fontWeight: "bold", color: T.accent, letterSpacing: 2 }}>{greeting()}, Fern.</span>
              <button style={{ background: "none", border: "none", color: T.textDim, fontSize: 22, cursor: "pointer" }} onClick={() => setCheckIn(false)}>×</button>
            </div>
            <p style={{ fontSize: TS - 2, color: T.textMuted, marginBottom: 16 }}>Here's what needs attention:</p>
            {focusTasks.length === 0
              ? <p style={{ fontSize: TS, color: T.textDim }}>Nothing urgent — good day for a "whenever" task.</p>
              : focusTasks.map(t => (
                <div key={t.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: TS - 3, background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 3, padding: "2px 5px" }}>{t.priority}</span>
                    <span style={{ fontSize: TS }}>{t.text}</span>
                  </div>
                  {t.subtasks.filter(s => !s.done).map(sub => (
                    <div key={sub.id} style={{ display: "flex", gap: 6, padding: "2px 0 2px 18px" }}>
                      <span style={{ color: T.accent, fontSize: TS }}>·</span>
                      <span style={{ fontSize: TS - 2, color: T.textMuted }}>{sub.text}</span>
                    </div>
                  ))}
                </div>
              ))
            }
            <button style={{ marginTop: 16, width: "100%", background: T.accent, border: "none", color: T.accentText, fontFamily: "'Courier New', monospace", fontWeight: "bold", fontSize: TS, padding: "11px", borderRadius: 4, cursor: "pointer", letterSpacing: 2 }}
              onClick={() => setCheckIn(false)}>let's get it</button>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={() => setShowSettings(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, padding: 24, width: "100%", maxWidth: 420, boxSizing: "border-box" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: TS + 2, fontWeight: "bold", letterSpacing: 2, color: T.accent }}>SETTINGS</span>
              <button style={{ background: "none", border: "none", color: T.textDim, fontSize: 22, cursor: "pointer" }} onClick={() => setShowSettings(false)}>×</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>theme</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["dark", "light"].map(t => (
                  <button key={t}
                    style={{ flex: 1, padding: "8px", borderRadius: 4, border: `1px solid ${theme === t ? T.accent : T.border2}`, background: theme === t ? T.accentBg : "transparent", color: theme === t ? T.accent : T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 1, cursor: "pointer" }}
                    onClick={() => saveTheme(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>text size</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["small", "medium", "large"].map(s => (
                  <button key={s}
                    style={{ flex: 1, padding: "8px", borderRadius: 4, border: `1px solid ${textSize === s ? T.accent : T.border2}`, background: textSize === s ? T.accentBg : "transparent", color: textSize === s ? T.accent : T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 1, cursor: "pointer" }}
                    onClick={() => saveTextSize(s)}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>your board id</div>
              <div style={{ fontSize: TS - 3, color: T.textMuted, marginBottom: 6 }}>Copy this to sync on another device</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input readOnly value={boardId}
                  style={{ flex: 1, background: T.bg, border: `1px solid ${T.border2}`, color: T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 3, padding: "7px 8px", borderRadius: 4, outline: "none" }} />
                <button
                  style={{ background: T.accent, border: "none", color: T.accentText, fontFamily: "'Courier New', monospace", fontSize: TS - 2, padding: "7px 12px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => navigator.clipboard.writeText(boardId)}>copy</button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>use existing board</div>
              <div style={{ fontSize: TS - 3, color: T.textMuted, marginBottom: 6 }}>Paste a board ID from another device</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  placeholder="paste board id..."
                  value={importId}
                  onChange={e => setImportId(e.target.value)}
                  style={{ flex: 1, background: T.bg, border: `1px solid ${T.border2}`, color: T.text, fontFamily: "'Courier New', monospace", fontSize: TS - 3, padding: "7px 8px", borderRadius: 4, outline: "none" }} />
                <button
                  style={{ background: "transparent", border: `1px solid ${T.accent}`, color: T.accent, fontFamily: "'Courier New', monospace", fontSize: TS - 2, padding: "7px 12px", borderRadius: 4, cursor: "pointer" }}
                  onClick={handleImportId}>switch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: mobile ? "10px 14px" : "12px 20px", borderBottom: `2px solid ${T.accent}`, flexShrink: 0, gap: 8, background: T.bg }}>
        <span style={{ fontSize: mobile ? 16 : 20, fontWeight: "bold", letterSpacing: mobile ? 3 : 5, color: T.accent, flexShrink: 0 }}>FERN'S LIST</span>
        <div style={{ display: "flex", alignItems: "center", gap: mobile ? 6 : 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, color: T.textMuted, whiteSpace: "nowrap" }}>{openCount} open · {doneCount} done</span>
          <span style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: T.textDim }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: syncDot, display: "inline-block" }} />
            {!mobile && syncLabel}
          </span>
          <button style={{ background: T.surface, border: `1px solid ${T.accent}`, color: T.accent, fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: "bold", padding: "7px 10px", borderRadius: 5, cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}
            onClick={() => setCheckIn(true)}>☀ check-in</button>
          <button style={{ background: T.surface, border: `1px solid ${T.border2}`, color: T.textMuted, fontFamily: "'Courier New', monospace", fontSize: 14, padding: "5px 10px", borderRadius: 5, cursor: "pointer" }}
            onClick={() => setShowSettings(true)}>⚙</button>
          {mobile && (
            <button style={{ background: T.surface, border: `1px solid ${panelOpen ? T.accent : T.border2}`, color: panelOpen ? T.accent : T.textMuted, fontFamily: "'Courier New', monospace", fontSize: 11, padding: "7px 10px", borderRadius: 5, cursor: "pointer" }}
              onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? "▲" : "▼"}</button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", flex: 1, overflow: "hidden" }}>
        {mobile ? (panelOpen && sidebar) : sidebar}

        <div style={{ flex: 1, padding: mobile ? "10px 8px" : "16px 20px", overflowY: "auto", background: T.bg }}>
          {visible.length === 0 && (
            <div style={{ color: T.border2, textAlign: "center", padding: 60, fontSize: TS }}>nothing here</div>
          )}
          {visible.map(t => {
            const isExp = expanded[t.id];
            const subDone = t.subtasks.filter(s => s.done).length;
            const isEditing = editingId === t.id;
            return (
              <div key={t.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 8, opacity: t.done ? 0.4 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: mobile ? 8 : 10, padding: mobile ? "10px 10px" : "11px 13px" }}>
                  <button style={{ background: "none", border: "none", color: T.accent, fontSize: TS + 2, cursor: "pointer", padding: "4px", marginTop: 1, flexShrink: 0 }}
                    onClick={() => toggle(t.id)}>{t.done ? "✓" : "□"}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        style={{ ...inputStyle, marginBottom: 4 }}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(t.id); if (e.key === "Escape") setEditingId(null); }}
                        onBlur={() => saveEdit(t.id)}
                        autoFocus
                      />
                    ) : (
                      <span
                        style={{ fontSize: TS, lineHeight: 1.5, display: "block", wordBreak: "break-word", cursor: "text", textAlign: "left" }}
                        onClick={() => { setEditingId(t.id); setEditText(t.text); }}>{t.text}</span>
                    )}
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        style={{ fontSize: TS - 4, background: T.surface2, border: `1px solid ${T.border2}`, color: T.textMuted, fontFamily: "'Courier New', monospace", padding: "2px 4px", borderRadius: 3, cursor: "pointer" }}
                        value={t.priority} onChange={e => changePri(t.id, e.target.value)}>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <select
                        style={{ fontSize: TS - 4, background: T.surface2, border: `1px solid ${T.border3}`, color: T.textMuted, fontFamily: "'Courier New', monospace", padding: "2px 4px", borderRadius: 3, cursor: "pointer" }}
                        value={t.category} onChange={e => changeCat(t.id, e.target.value)}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <span style={{ fontSize: TS - 4, color: T.textFaint }}>{t.created}</span>
                      {t.subtasks.length > 0 && (
                        <span style={{ fontSize: TS - 4, color: T.accent, opacity: 0.7 }}>{subDone}/{t.subtasks.length}</span>
                      )}
                    </div>
                  </div>
                  <button style={{ background: "none", border: `1px solid ${T.border2}`, color: T.textMuted, fontSize: TS - 1, cursor: "pointer", padding: "3px 7px", borderRadius: 3, flexShrink: 0 }}
                    onClick={() => setExpanded(p => ({ ...p, [t.id]: !p[t.id] }))}>{isExp ? "▾" : "▸"}</button>
                  <button style={{ background: "none", border: "none", color: T.textDim, fontSize: TS + 6, cursor: "pointer", padding: "4px", lineHeight: 1, flexShrink: 0 }}
                    onClick={() => remove(t.id)}>×</button>
                </div>

                {isExp && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: mobile ? "8px 10px 11px 28px" : "8px 13px 11px 40px" }}>
                    {t.subtasks.length === 0 && (
                      <div style={{ fontSize: TS - 2, color: T.border2, marginBottom: 6 }}>no subtasks yet</div>
                    )}
                    {t.subtasks.map(sub => (
                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                        <button style={{ background: "none", border: "none", color: T.accent, fontSize: TS, cursor: "pointer", padding: "4px", width: 20, flexShrink: 0 }}
                          onClick={() => toggleSub(t.id, sub.id)}>{sub.done ? "✓" : "□"}</button>
                        <span style={{ flex: 1, fontSize: TS - 2, color: sub.done ? T.textFaint : T.textMuted, textDecoration: sub.done ? "line-through" : "none" }}>{sub.text}</span>
                        <button style={{ background: "none", border: "none", color: T.textFaint, fontSize: TS + 2, cursor: "pointer", padding: "4px" }}
                          onClick={() => removeSub(t.id, sub.id)}>×</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7 }}>
                      <span style={{ color: T.textFaint, fontSize: TS }}>└</span>
                      <input
                        style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${T.subInputBorder}`, color: T.textMuted, fontFamily: "'Courier New', monospace", fontSize: TS - 2, padding: "4px 0", outline: "none" }}
                        placeholder="add subtask..."
                        value={subInputs[t.id] || ""}
                        onChange={e => setSubInputs(p => ({ ...p, [t.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addSub(t.id)}
                      />
                      <button
                        style={{ background: "none", border: `1px solid ${T.border2}`, color: T.accent, fontFamily: "'Courier New', monospace", fontSize: TS, padding: "3px 9px", borderRadius: 3, cursor: "pointer" }}
                        onClick={() => addSub(t.id)}>+</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
