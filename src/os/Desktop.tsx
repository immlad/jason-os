import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Settings as SettingsIcon, Sparkles, GraduationCap, Shield, Bell, Globe, AppWindow } from "lucide-react";
import { useOS } from "./store";
import { wallpapers } from "./themes";
import { Window } from "./components/Window";
import { Dock, DockItem } from "./components/Dock";
import { MenuBar } from "./components/MenuBar";
import { ControlCenter } from "./components/ControlCenter";
import { DesktopIcons } from "./components/DesktopIcons";
import { ContextMenu, MenuEntry } from "./components/ContextMenu";
import { About } from "./apps/About";
import { Settings } from "./apps/Settings";
import { Chat, Nebulo } from "./apps/LiquidAura";
import { AdminPanel } from "./apps/AdminPanel";
import { WebAppCreator } from "./apps/WebAppCreator";
import { WebFrame } from "./apps/WebFrame";
import scareImg from "@/assets/scare.jpg";

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
  const me = os.state.users.find(u => u.id === os.state.currentUserId);
  const [wins, setWins] = useState<OpenWin[]>([]);
  const [zCounter, setZCounter] = useState(10);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [leoClicks, setLeoClicks] = useState(0);
  const [jasonClicks, setJasonClicks] = useState(0);
  const [showCC, setShowCC] = useState(false);
  const [activeTroll, setActiveTroll] = useState<string | null>(null);
  const [seenGlobal, setSeenGlobal] = useState<string[]>([]);
  const [activeGlobal, setActiveGlobal] = useState<{ from: string; text: string } | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const [konami, setKonami] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [eggMsg, setEggMsg] = useState<string | null>(null);
  const [matrix, setMatrix] = useState(false);
  const cornerHits = useRef<{ tl: number; tr: number; bl: number; br: number }>({ tl: 0, tr: 0, bl: 0, br: 0 });

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
    const t = os.state.trollEvents.find(t => t.targetId === me.id);
    if (t && activeTroll !== t.id) setActiveTroll(t.id);
  }, [os.state.trollEvents, me, activeTroll]);

  // Global messages
  useEffect(() => {
    const last = os.state.globalMessages[os.state.globalMessages.length - 1];
    if (last && !seenGlobal.includes(last.id)) {
      setSeenGlobal(s => [...s, last.id]);
      setActiveGlobal({ from: last.from, text: last.text });
      setTimeout(() => setActiveGlobal(null), 6000);
    }
  }, [os.state.globalMessages, seenGlobal]);

  // Easter eggs: Konami + typed words
  useEffect(() => {
    const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    function onKey(e: KeyboardEvent) {
      // Konami
      const next = [...konami, e.key].slice(-KONAMI.length);
      setKonami(next);
      if (next.join(",").toLowerCase() === KONAMI.join(",").toLowerCase()) {
        setMatrix(true);
        setEggMsg("🎮 KONAMI CODE — Matrix mode!");
        setTimeout(() => setEggMsg(null), 3000);
        setTimeout(() => setMatrix(false), 8000);
      }
      // typed words
      if (e.key.length === 1) {
        const t = (typed + e.key.toLowerCase()).slice(-20);
        setTyped(t);
        if (t.endsWith("jason")) { setEggMsg("👑 JASON!"); setTimeout(() => setEggMsg(null), 2000); }
        if (t.endsWith("rosebud")) { os.unlockSebastian(); setEggMsg("🌹 Sebastian unlocked"); setTimeout(() => setEggMsg(null), 2500); }
        if (t.endsWith("leothelegend")) { os.unlockLeo(); setEggMsg("🦁 Leo unlocked"); setTimeout(() => setEggMsg(null), 2500); }
        if (t.endsWith("meow")) { setEggMsg("🐱 meow"); setTimeout(() => setEggMsg(null), 1500); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [konami, typed, os]);

  // Corner clicks easter egg
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const w = window.innerWidth, h = window.innerHeight, m = 40;
      const c = cornerHits.current;
      if (e.clientX < m && e.clientY < m) c.tl++;
      else if (e.clientX > w - m && e.clientY < m) c.tr++;
      else if (e.clientX < m && e.clientY > h - m) c.bl++;
      else if (e.clientX > w - m && e.clientY > h - m) c.br++;
      if (c.tl + c.tr + c.bl + c.br >= 12 && c.tl && c.tr && c.bl && c.br) {
        cornerHits.current = { tl: 0, tr: 0, bl: 0, br: 0 };
        setEggMsg("✨ Four corners — secret unlocked");
        os.unlockLeo();
        setTimeout(() => setEggMsg(null), 2500);
      }
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [os]);

  const apps = useMemo(() => {
    const list: (DockItem & { title: string; render: () => JSX.Element; size?: { w: number; h: number } })[] = [
      { id: "about", name: "About", title: "About JASON OS", Icon: Info, color: "#5e9bf5", render: () => <About /> },
      { id: "settings", name: "Settings", title: "Settings", Icon: SettingsIcon, color: "#888", render: () => <Settings /> },
      { id: "chat", name: "Chat", title: "Chat", Icon: Sparkles, color: "#7c3aed", render: () => <Chat />, size: { w: 900, h: 600 } },
      { id: "nebulo", name: "Nebulo", title: "Nebulo", Icon: GraduationCap, color: "#10b981", render: () => <Nebulo />, size: { w: 1000, h: 640 } },
      { id: "webcreator", name: "Web Apps", title: "Web App Creator", Icon: AppWindow, color: "#f59e0b", render: () => <WebAppCreator />, size: { w: 720, h: 600 } },
    ];
    if (me?.isAdmin) {
      list.push({ id: "admin", name: "Admin", title: "Admin Panel", Icon: Shield, color: "#ef4444", render: () => <AdminPanel /> });
    }
    // user-added webapps
    for (const w of (me?.webApps || [])) {
      list.push({
        id: w.id, name: w.name, title: w.name, Icon: Globe, color: w.color || "#5e9bf5",
        iconImage: w.icon, isWebApp: true,
        render: () => <WebFrame url={w.url} name={w.name} />,
        size: { w: 1100, h: 720 },
      } as any);
    }
    return list;
  }, [me?.isAdmin, me?.webApps]);

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

  function showCtx(e: React.MouseEvent, items: MenuEntry[]) {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, items });
  }

  const desktopMenu: MenuEntry[] = [
    { label: "New Web App…", onClick: () => openApp("webcreator") },
    { label: "Open Settings", onClick: () => openApp("settings") },
    { separator: true, label: "" },
    { label: "Toggle Fullscreen", onClick: async () => {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {}
    } },
    { label: "Close All Windows", onClick: () => setWins([]) },
    { separator: true, label: "" },
    { label: "Reload", onClick: () => window.location.reload() },
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ backgroundImage: `url(${wp})`, backgroundSize: "cover", backgroundPosition: "center" }}
      onContextMenu={(e) => showCtx(e, desktopMenu)}
    >
      <MenuBar appName={topApp?.name || "Finder"} onAbout={() => openApp("about")} onToggleControl={() => setShowCC(v => !v)} />

      <DesktopIcons
        items={apps}
        onOpen={openApp}
        onContext={(e, app) => {
          const isWeb = (app as any).isWebApp;
          const pinned = (me?.pinnedApps || []).includes(app.id);
          const items: MenuEntry[] = [
            { label: "Open", onClick: () => openApp(app.id) },
            { label: pinned ? "Unpin from Dock" : "Pin to Dock", onClick: () => pinned ? os.unpinApp(app.id) : os.pinApp(app.id) },
          ];
          if (isWeb) items.push({ separator: true, label: "" }, { label: "Remove Web App", danger: true, onClick: () => os.removeWebApp(app.id) });
          showCtx(e as any, items);
        }}
      />

      {/* Big JASON OS title — liquid glass */}
      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-5 pointer-events-none z-10 px-4">
        <h1 className="text-7xl md:text-9xl font-black liquid-text tracking-tight">JASON OS</h1>
        <div
          key={phraseIdx}
          className="animate-fade-up pointer-events-auto cursor-default"
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
          <p className="text-2xl md:text-3xl font-semibold liquid-text tracking-wide">{phrasePool[phraseIdx]}</p>
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

      <Dock
        items={apps}
        onOpen={openApp}
        openIds={wins.map(w => w.appId)}
        onContext={(e, app) => {
          const isWeb = (app as any).isWebApp;
          const pinned = (me?.pinnedApps || []).includes(app.id);
          const items: MenuEntry[] = [
            { label: "Open", onClick: () => openApp(app.id) },
            { label: pinned ? "Unpin from Dock" : "Keep in Dock", onClick: () => pinned ? os.unpinApp(app.id) : os.pinApp(app.id) },
            { label: "Show All Windows", onClick: () => {} },
          ];
          if (isWeb) items.push({ separator: true, label: "" }, { label: "Remove Web App", danger: true, onClick: () => os.removeWebApp(app.id) });
          showCtx(e as any, items);
        }}
      />

      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctx.items} onClose={() => setCtx(null)} />}

      {eggMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 liquid-glass rounded-full px-5 py-2 z-[80] animate-fade-up text-sm font-medium os-text">
          {eggMsg}
        </div>
      )}

      {matrix && (
        <div className="fixed inset-0 z-[90] pointer-events-none mix-blend-screen"
             style={{ background: "repeating-linear-gradient(0deg, rgba(0,255,80,0.08) 0 2px, transparent 2px 4px)", animation: "phraseFade 1s linear infinite" }} />
      )}

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
        return <Jumpscare imageUrl={me?.customJumpscare || ev.imageUrl || scareImg} onDismiss={() => { os.dismissTroll(ev.id); setActiveTroll(null); }} />;
      })()}
    </div>
  );
}

function Jumpscare({ imageUrl, onDismiss }: { imageUrl: string; onDismiss: () => void }) {
  const [phase, setPhase] = useState<"flash" | "scare" | "calm">("flash");
  useEffect(() => {
    // play screech
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ac = new Ctx();
      // Layered scream: dissonant oscillators + noise burst
      const master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
      [180, 260, 410, 720].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = i % 2 ? "square" : "sawtooth";
        o.frequency.setValueAtTime(f, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(f * 8, ac.currentTime + 0.5);
        o.frequency.exponentialRampToValueAtTime(f * 0.6, ac.currentTime + 2.4);
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.45, ac.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 2.6);
        o.connect(g).connect(master);
        o.start();
        o.stop(ac.currentTime + 2.6);
      });
      // White-noise burst
      const buf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = ac.createBufferSource();
      noise.buffer = buf;
      const ng = ac.createGain();
      ng.gain.value = 0.5;
      noise.connect(ng).connect(master);
      noise.start();
      if (navigator.vibrate) navigator.vibrate([400, 60, 600, 60, 800, 60, 400]);
    } catch {}
    const t1 = setTimeout(() => setPhase("scare"), 100);
    const t2 = setTimeout(() => setPhase("calm"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center cursor-pointer" onClick={onDismiss}>
      <div className="absolute inset-0" style={{
        background: phase === "flash" ? "white" : "black",
        animation: phase === "scare" ? "phraseFade 0.12s linear infinite" : undefined,
      }} />
      {phase !== "flash" && (
        <div className="relative text-center w-full h-full flex flex-col items-center justify-center" style={{ animation: phase === "scare" ? "scareShake 0.06s linear infinite" : undefined }}>
          <img src={imageUrl} alt="" className="w-screen h-screen object-cover absolute inset-0" style={{ filter: phase === "scare" ? "contrast(1.6) saturate(1.6) brightness(1.1)" : "none" }} />
          <p className="relative mt-3 text-red-600 text-5xl md:text-8xl font-black tracking-widest" style={{ textShadow: "0 0 32px red, 0 0 12px white, 0 0 60px black" }}>BOO!</p>
          {phase === "calm" && <p className="text-white/70 text-xs mt-2">click anywhere to dismiss</p>}
        </div>
      )}
    </div>
  );
}