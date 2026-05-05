import { useEffect, useMemo, useState } from "react";
import { Info, Settings as SettingsIcon, Sparkles, GraduationCap, Shield, Bell } from "lucide-react";
import { useOS } from "./store";
import { wallpapers } from "./themes";
import { Window } from "./components/Window";
import { Dock, DockItem } from "./components/Dock";
import { MenuBar } from "./components/MenuBar";
import { ControlCenter } from "./components/ControlCenter";
import { DesktopIcons } from "./components/DesktopIcons";
import { About } from "./apps/About";
import { Settings } from "./apps/Settings";
import { Chat, Nebulo } from "./apps/LiquidAura";
import { AdminPanel } from "./apps/AdminPanel";

const PHRASES = [
  "I AM ICEMAN",
  "I AM FIREMAN",
  "Jamango",
  "Ja makin me dinner mom?",
  "Leo",
  "Jason is Tuff",
];
const JASON_CAT_PHRASE = "Jason";

interface OpenWin {
  id: string;
  appId: string;
  z: number;
}

export function Desktop() {
  const os = useOS();
  const me = os.state.users.find(u => u.username === os.state.currentUser);
  const [wins, setWins] = useState<OpenWin[]>([]);
  const [zCounter, setZCounter] = useState(10);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [leoClicks, setLeoClicks] = useState(0);
  const [jasonClicks, setJasonClicks] = useState(0);
  const [showCC, setShowCC] = useState(false);
  const [activeTroll, setActiveTroll] = useState<string | null>(null);
  const [seenGlobal, setSeenGlobal] = useState<string[]>([]);
  const [activeGlobal, setActiveGlobal] = useState<{ from: string; text: string } | null>(null);

  const phrasePool = useMemo(() => {
    const list = [...PHRASES];
    if (os.state.sebastianUnlocked && os.state.leoUnlocked && !os.state.jasonCatUnlocked) {
      list.push(JASON_CAT_PHRASE);
    }
    return list;
  }, [os.state.sebastianUnlocked, os.state.leoUnlocked, os.state.jasonCatUnlocked]);

  // Phrase rotation - randomized
  useEffect(() => {
    const t = setInterval(() => {
      setPhraseIdx(Math.floor(Math.random() * phrasePool.length));
    }, 4000);
    return () => clearInterval(t);
  }, [phrasePool.length]);

  // Apply theme class + load user's saved theme on login
  useEffect(() => {
    document.body.classList.remove("theme-cloud", "theme-night", "theme-forest", "theme-jason", "theme-sebastian", "theme-leo", "theme-jasoncat");
    document.body.classList.add(`theme-${os.state.theme}`);
  }, [os.state.theme]);

  useEffect(() => {
    if (me?.theme && me.theme !== os.state.theme) os.setTheme(me.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.username]);

  // Custom font
  useEffect(() => {
    const id = "jason-os-custom-font";
    document.getElementById(id)?.remove();
    if (me?.customFont) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `@font-face{font-family:"JasonUserFont";src:url(${me.customFont.dataUrl});}body{font-family:"JasonUserFont",-apple-system,system-ui,sans-serif;}`;
      document.head.appendChild(style);
    }
  }, [me?.customFont?.dataUrl]);

  // Troll detection
  useEffect(() => {
    if (!me) return;
    const t = os.state.trollEvents.find(t => t.target === me.username);
    if (t && activeTroll !== t.id) setActiveTroll(t.id);
  }, [os.state.trollEvents, me, activeTroll]);

  // Global messages
  useEffect(() => {
    const last = os.state.globalMessages[os.state.globalMessages.length - 1];
    if (last && !seenGlobal.includes(last.id)) {
      setSeenGlobal(s => [...s, last.id]);
      setActiveGlobal({ from: last.from, text: last.text });
      setTimeout(() => setActiveGlobal(null), 5000);
    }
  }, [os.state.globalMessages, seenGlobal]);

  const apps = useMemo(() => {
    const list: (DockItem & { title: string; render: () => JSX.Element; size?: { w: number; h: number } })[] = [
      { id: "about", name: "About", title: "About JASON OS", Icon: Info, color: "#5e9bf5", render: () => <About /> },
      { id: "settings", name: "Settings", title: "Settings", Icon: SettingsIcon, color: "#888", render: () => <Settings /> },
      { id: "chat", name: "Chat", title: "Chat", Icon: Sparkles, color: "#7c3aed", render: () => <Chat />, size: { w: 900, h: 600 } },
      { id: "nebulo", name: "Nebulo", title: "Nebulo", Icon: GraduationCap, color: "#10b981", render: () => <Nebulo />, size: { w: 1000, h: 640 } },
    ];
    if (me?.isAdmin) {
      list.push({ id: "admin", name: "Admin", title: "Admin Panel", Icon: Shield, color: "#ef4444", render: () => <AdminPanel /> });
    }
    return list;
  }, [me?.isAdmin]);

  function openApp(id: string) {
    setZCounter(z => z + 1);
    setWins(w => {
      const existing = w.find(x => x.appId === id);
      if (existing) return w.map(x => x.appId === id ? { ...x, z: zCounter + 1 } : x);
      return [...w, { id: crypto.randomUUID(), appId: id, z: zCounter + 1 }];
    });
  }
  function focus(id: string) {
    setZCounter(z => z + 1);
    setWins(w => w.map(x => x.id === id ? { ...x, z: zCounter + 1 } : x));
  }
  function close(id: string) {
    setWins(w => w.filter(x => x.id !== id));
  }

  useEffect(() => {
    const handler = () => setWins([]);
    window.addEventListener("jason-close-all", handler);
    return () => window.removeEventListener("jason-close-all", handler);
  }, []);

  const wp = me?.customWallpaper || wallpapers[os.state.theme];
  const topWin = [...wins].sort((a, b) => b.z - a.z)[0];
  const topApp = topWin ? apps.find(a => a.id === topWin.appId) : null;

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ backgroundImage: `url(${wp})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <MenuBar appName={topApp?.name || "Finder"} onAbout={() => openApp("about")} onToggleControl={() => setShowCC(v => !v)} />

      <DesktopIcons items={apps} onOpen={openApp} />

      {/* Big JASON OS title — liquid glass */}
      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-5 pointer-events-none z-10 px-4">
        <div className="liquid-glass rounded-[40px] px-10 py-6 inline-block">
          <h1 className="text-6xl md:text-8xl font-black liquid-text tracking-tight">JASON OS</h1>
        </div>
        <div
          key={phraseIdx}
          className="liquid-chip rounded-full px-6 py-2.5 animate-fade-up pointer-events-auto cursor-default"
          onClick={() => {
            const cur = phrasePool[phraseIdx];
            if (cur === "Leo" && !os.state.leoUnlocked) {
              const n = leoClicks + 1;
              setLeoClicks(n);
              if (n >= 10) os.unlockLeo();
            }
            if (cur === JASON_CAT_PHRASE && os.state.sebastianUnlocked && os.state.leoUnlocked && !os.state.jasonCatUnlocked) {
              const n = jasonClicks + 1;
              setJasonClicks(n);
              if (n >= 10) os.unlockJasonCat();
            }
          }}
        >
          <p className="text-xl md:text-2xl font-semibold liquid-text tracking-wide">{phrasePool[phraseIdx]}</p>
        </div>
      </div>

      {showCC && <ControlCenter onClose={() => setShowCC(false)} />}

      {/* Windows */}
      {wins.map(w => {
        const app = apps.find(a => a.id === w.appId);
        if (!app) return null;
        return (
          <Window
            key={w.id}
            title={app.title}
            z={w.z}
            onClose={() => close(w.id)}
            onFocus={() => focus(w.id)}
            initial={app.size ? { x: 140, y: 80, w: app.size.w, h: app.size.h } : undefined}
          >
            {app.render()}
          </Window>
        );
      })}

      <Dock items={apps} onOpen={openApp} openIds={wins.map(w => w.appId)} />

      {/* Global broadcast notification */}
      {activeGlobal && (
        <div className="fixed top-10 right-4 glass-strong rounded-xl p-4 max-w-sm z-[60] animate-fade-up flex gap-3 os-text">
          <Bell className="w-5 h-5 text-[hsl(var(--os-accent))]" />
          <div>
            <div className="text-xs os-text-muted">📢 Global from {activeGlobal.from}</div>
            <div className="text-sm font-medium">{activeGlobal.text}</div>
          </div>
        </div>
      )}

      {/* Troll overlay */}
      {activeTroll && (() => {
        const ev = os.state.trollEvents.find(t => t.id === activeTroll);
        if (!ev) return null;
        return (
          <div className="fixed inset-0 z-[100] bg-black/80 grid place-items-center animate-fade-up" onClick={() => { os.dismissTroll(ev.id); setActiveTroll(null); }}>
            <div className="text-center">
              <img src={ev.imageUrl} alt="trolled" className="max-w-[80vw] max-h-[70vh] rounded-2xl shadow-2xl mx-auto" />
              <p className="mt-4 text-white text-2xl font-bold">YOU GOT TROLLED 😂</p>
              <p className="text-white/70 text-sm mt-2">click anywhere to dismiss</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}