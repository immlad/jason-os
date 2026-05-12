import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Settings as SettingsIcon, Sparkles, GraduationCap, Shield, Bell, Globe, AppWindow, ShoppingBag, Trophy } from "lucide-react";
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
import { Shop } from "./apps/Shop";
import { Achievements } from "./apps/Achievements";
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
  const [activeGlobal, setActiveGlobal] = useState<{ from: string; text: string; textSize: number; boxSize: string } | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const [konami, setKonami] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [eggMsg, setEggMsg] = useState<string | null>(null);
  const [matrix, setMatrix] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cornerHits = useRef<{ tl: number; tr: number; bl: number; br: number }>({ tl: 0, tr: 0, bl: 0, br: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const clickTimes = useRef<number[]>([]);
  const lastInputRef = useRef<number>(Date.now());
  const titleClicksRef = useRef<{ n: number; t: number }>({ n: 0, t: 0 });
  const openedAppsRef = useRef<Set<string>>(new Set());
  const dismissedTrollsRef = useRef<number>(0);

  // Track mouse for presence
  useEffect(() => {
    function m(e: MouseEvent) { mouseRef.current = { x: e.clientX, y: e.clientY }; }
    window.addEventListener("mousemove", m);
    return () => window.removeEventListener("mousemove", m);
  }, []);

  // Track fullscreen (browser API + window-level macOS-style fullscreen)
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    const onWinFs = (e: any) => setIsFullscreen(!!e.detail);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("jason-fullscreen", onWinFs as any);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("jason-fullscreen", onWinFs as any);
    };
  }, []);

  const phrasePool = useMemo(() => {
    const list = [...PHRASES];
    if (os.state.sebastianUnlocked && os.state.leoUnlocked && !os.state.jasonCatUnlocked) {
      list.push(JASON_CAT_PHRASE);
    }
    return list;
  }, [os.state.sebastianUnlocked, os.state.leoUnlocked, os.state.jasonCatUnlocked]);

  // Phrase rotation
  useEffect(() => {
    const t = setInterval(() => {
      setPhraseIdx(Math.floor(Math.random() * phrasePool.length));
    }, 4000);
    return () => clearInterval(t);
  }, [phrasePool.length]);

  // Apply theme
  useEffect(() => {
    document.body.classList.remove("theme-cloud", "theme-night", "theme-forest", "theme-jason", "theme-sebastian", "theme-leo", "theme-jasoncat");
    document.body.classList.add(`theme-${os.state.theme}`);
  }, [os.state.theme]);

  useEffect(() => {
    if (me?.theme && me.theme !== os.state.theme) os.setTheme(me.theme);
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
      setActiveGlobal({ from: last.from, text: last.text, textSize: last.textSize ?? 18, boxSize: last.boxSize ?? "md" });
      setTimeout(() => setActiveGlobal(null), last.durationMs ?? 6000);
    }
  }, [os.state.globalMessages, seenGlobal]);

  // Key events (Konami + typed)
  useEffect(() => {
    const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

    function onKey(e: KeyboardEvent) {
      os.pushActivity("typed", e.key);

      // Konami
      const next = [...konami, e.key].slice(-KONAMI.length);
      setKonami(next);
      if (next.join(",").toLowerCase() === KONAMI.join(",").toLowerCase()) {
        os.pushActivity("unlock", "konami");
        os.discoverAchievement("konami");
        setMatrix(true);
        setEggMsg("🎮 KONAMI CODE — Matrix mode!");
        setTimeout(() => setEggMsg(null), 3000);
        setTimeout(() => setMatrix(false), 8000);
      }

      // typed words
      if (e.key.length === 1) {
        const t = (typed + e.key.toLowerCase()).slice(-20);
        setTyped(t);

        if (t.endsWith("jason")) {
          os.pushActivity("unlock", "jason");
          setEggMsg("👑 JASON!");
          setTimeout(() => setEggMsg(null), 2000);
        }
        if (t.endsWith("jasonking")) {
          os.discoverAchievement("jasonking");
          setEggMsg("👑 jasonking — secret found");
          setTimeout(() => setEggMsg(null), 2500);
        }
        if (t.endsWith("iceman")) {
          os.discoverAchievement("whisper_iceman");
          setEggMsg("❄️ whisper of iceman");
          setTimeout(() => setEggMsg(null), 2500);
        }
        if (t.endsWith("rosebud")) {
          os.pushActivity("unlock", "sebastian");
          os.unlockSebastian();
          os.discoverAchievement("rosebud");
          setEggMsg("🌹 Sebastian unlocked");
          setTimeout(() => setEggMsg(null), 2500);
        }
        if (t.endsWith("leothelegend")) {
          os.pushActivity("unlock", "leo");
          os.unlockLeo();
          os.discoverAchievement("leothelegend");
          setEggMsg("🦁 Leo unlocked");
          setTimeout(() => setEggMsg(null), 2500);
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [konami, typed, os]);

  // Corner clicks
  useEffect(() => {
    function onClick(e: MouseEvent) {
      os.pushActivity("click", `${e.clientX},${e.clientY}`);
      lastInputRef.current = Date.now();

      // Speed clicker — 30 clicks in 5s
      const nowT = Date.now();
      clickTimes.current.push(nowT);
      clickTimes.current = clickTimes.current.filter(t => nowT - t < 5000);
      if (clickTimes.current.length >= 30) {
        clickTimes.current = [];
        os.discoverAchievement("speed_clicker");
        setEggMsg("⚡ Speed clicker!");
        setTimeout(() => setEggMsg(null), 2000);
      }

      const w = window.innerWidth, h = window.innerHeight, m = 40;
      const c = cornerHits.current;
      if (e.clientX < m && e.clientY < m) c.tl++;
      else if (e.clientX > w - m && e.clientY < m) c.tr++;
      else if (e.clientX < m && e.clientY > h - m) c.bl++;
      else if (e.clientX > w - m && e.clientY > h - m) c.br++;

      if (c.tl + c.tr + c.bl + c.br >= 12 && c.tl && c.tr && c.bl && c.br) {
        cornerHits.current = { tl: 0, tr: 0, bl: 0, br: 0 };
        os.pushActivity("unlock", "four-corners");
        os.discoverAchievement("four_corners");
        setEggMsg("✨ Four corners — secret unlocked");
        os.unlockLeo();
        setTimeout(() => setEggMsg(null), 2500);
      }
    }

    window.addEventListener("click", onClick);
    window.addEventListener("keydown", () => { lastInputRef.current = Date.now(); });
    window.addEventListener("mousemove", () => { lastInputRef.current = Date.now(); });
    // Ghost idle — no input for 60s
    const idleTimer = setInterval(() => {
      if (Date.now() - lastInputRef.current > 60000) {
        os.discoverAchievement("ghost_idle");
      }
    }, 5000);
    // Midnight owl — opened during 00:00-00:05 local
    const hh = new Date().getHours(), mm = new Date().getMinutes();
    if (hh === 0 && mm < 5) os.discoverAchievement("midnight_owl");
    return () => { window.removeEventListener("click", onClick); clearInterval(idleTimer); };
  }, [os]);

  // Apps list
  const apps = useMemo(() => {
    const list: (DockItem & { title: string; render: () => JSX.Element; size?: { w: number; h: number } })[] = [
      { id: "about", name: "About", title: "About JASON OS", Icon: Info, color: "#5e9bf5", render: () => <About /> },
      { id: "settings", name: "Settings", title: "Settings", Icon: SettingsIcon, color: "#888", render: () => <Settings /> },
      { id: "chat", name: "Chat", title: "Chat", Icon: Sparkles, color: "#7c3aed", render: () => <Chat />, size: { w: 900, h: 600 } },
      { id: "nebulo", name: "Nebulo", title: "Nebulo", Icon: GraduationCap, color: "#10b981", render: () => <Nebulo />, size: { w: 1000, h: 640 } },
      { id: "webcreator", name: "Web Apps", title: "Web App Creator", Icon: AppWindow, color: "#f59e0b", render: () => <WebAppCreator />, size: { w: 720, h: 600 } },
      { id: "shop", name: "Shop", title: "JASON Shop", Icon: ShoppingBag, color: "#facc15", render: () => <Shop />, size: { w: 1000, h: 700 } },
      { id: "achievements", name: "Achievements", title: "Achievements", Icon: Trophy, color: "#eab308", render: () => <Achievements />, size: { w: 920, h: 640 } },
    ];

    if (me?.isAdmin) {
      list.push({ id: "admin", name: "Admin", title: "Admin Panel", Icon: Shield, color: "#ef4444", render: () => <AdminPanel /> });
    }

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

  // Open app
  function openApp(id: string) {
    os.pushActivity("open-app", id);
    // Track for "app_collector" achievement (open 8 distinct apps in one session)
    openedAppsRef.current.add(id);
    if (openedAppsRef.current.size >= 8) os.discoverAchievement("app_collector");
    if (id === "shop") os.discoverAchievement("shop_curious");
    setZCounter(z => z + 1);
    setWins(w => {
      const existing = w.find(x => x.appId === id);
      if (existing) return w.map(x => x.appId === id ? { ...x, z: zCounter + 1 } : x);
      return [...w, { id: crypto.randomUUID(), appId: id, z: zCounter + 1 }];
    });
  }

  function focus(id: string) {
    os.pushActivity("focus-window", id);

    setZCounter(z => z + 1);
    setWins(w => w.map(x => x.id === id ? { ...x, z: zCounter + 1 } : x));
  }

  function close(id: string) {
    os.pushActivity("close-window", id);
    setWins(w => w.filter(x => x.id !== id));
  }

  // Close all windows event
  useEffect(() => {
    const handler = () => {
      os.pushActivity("close-all");
      setWins([]);
    };
    window.addEventListener("jason-close-all", handler);
    return () => window.removeEventListener("jason-close-all", handler);
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!me) return;
    const tick = () => {
      const top = [...wins].sort((a, b) => b.z - a.z)[0];
      const app = top ? apps.find(a => a.id === top.appId) : null;
      os.heartbeat(app?.name || null, window.location.pathname, mouseRef.current.x, mouseRef.current.y);
    };
    tick();
    const i = setInterval(tick, 1500);
    return () => clearInterval(i);
  }, [me?.id, wins, apps]);

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
    {
      label: "Toggle Fullscreen",
      onClick: async () => {
        os.pushActivity("fullscreen-toggle");
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await document.documentElement.requestFullscreen();
        } catch {}
      }
    },
    { label: "Close All Windows", onClick: () => { os.pushActivity("close-all"); setWins([]); } },
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

      {/* Big JASON OS title */}
      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-5 pointer-events-none z-10 px-4">
        <h1
          className="text-7xl md:text-9xl font-black liquid-text tracking-tight pointer-events-auto cursor-default"
          onClick={() => {
            const nowT = Date.now();
            const r = titleClicksRef.current;
            if (nowT - r.t > 600) r.n = 0;
            r.n++; r.t = nowT;
            if (r.n >= 3) {
              r.n = 0;
              os.discoverAchievement("logo_triple_click");
              setEggMsg("✨ Logo secret found");
              setTimeout(() => setEggMsg(null), 2000);
            }
          }}
        >JASON OS</h1>
        <div
          key={phraseIdx}
          className="animate-fade-up pointer-events-auto cursor-default"
          onClick={() => {
            const cur = phrasePool[phraseIdx];
            if (cur === "Leo" && !os.state.leoUnlocked) {
              const n = leoClicks + 1;
              setLeoClicks(n);
              if (n >= 10) {
                os.pushActivity("unlock", "leo");
                os.unlockLeo();
              }
            }
            if (cur === JASON_CAT_PHRASE && os.state.sebastianUnlocked && os.state.leoUnlocked && !os.state.jasonCatUnlocked) {
              const n = jasonClicks + 1;
              setJasonClicks(n);
              if (n >= 10) {
                os.pushActivity("unlock", "jasoncat");
                os.unlockJasonCat();
              }
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

      {!isFullscreen && <Dock
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
                    if (isWeb)
            items.push(
              { separator: true, label: "" },
              {
                label: "Remove Web App",
                danger: true,
                onClick: () => os.removeWebApp(app.id),
              }
            );
          showCtx(e as any, items);
        }}
      />}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          items={ctx.items}
          onClose={() => setCtx(null)}
        />
      )}

      {eggMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 liquid-glass rounded-full px-5 py-2 z-[80] animate-fade-up text-sm font-medium os-text">
          {eggMsg}
        </div>
      )}

      {matrix && (
        <div
          className="fixed inset-0 z-[90] pointer-events-none mix-blend-screen"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,255,80,0.08) 0 2px, transparent 2px 4px)",
            animation: "phraseFade 1s linear infinite",
          }}
        />
      )}

      {/* Global broadcast — top overlay */}
      {activeGlobal && (() => {
        const widthMap: Record<string, string> = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-[90vw]" };
        const padMap: Record<string, string> = { sm: "p-4", md: "p-5", lg: "p-7", xl: "p-9", full: "p-10" };
        return (
          <div className="fixed top-10 inset-x-0 z-[150] flex justify-center pointer-events-none animate-fade-up px-4">
            <div className={`glass-strong rounded-2xl ${padMap[activeGlobal.boxSize] || padMap.md} ${widthMap[activeGlobal.boxSize] || widthMap.md} w-full os-text shadow-2xl border border-white/20`}>
              <div className="flex items-center gap-2 text-xs os-text-muted mb-3">
                <Bell className="w-4 h-4 text-[hsl(var(--os-accent))]" />
                📢 Announcement from {activeGlobal.from}
              </div>
              <div className="font-semibold leading-snug" style={{ fontSize: `${activeGlobal.textSize}px` }}>
                {activeGlobal.text}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Troll overlay */}
      {activeTroll &&
        (() => {
          const ev = os.state.trollEvents.find((t) => t.id === activeTroll);
          if (!ev) return null;
          return (
            <Jumpscare
              imageUrl={me?.customJumpscare || ev.imageUrl || scareImg}
              durationMs={ev.durationMs ?? 3500}
              onDismiss={() => {
                os.dismissTroll(ev.id);
                setActiveTroll(null);
                dismissedTrollsRef.current++;
                if (dismissedTrollsRef.current >= 3) os.discoverAchievement("jumpscare_survivor");
              }}
            />
          );
        })()}

      {/* Screen lock overlay (admin shut down this user's screen) */}
      {me?.screenLocked && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-fade-up">
          <Shield className="w-20 h-20 mb-6 text-red-500 animate-pulse" />
          <h1 className="text-4xl font-bold mb-3">Screen Disabled</h1>
          <p className="text-lg opacity-80 max-w-md text-center px-6">
            {me.screenLockMessage || "Your screen has been disabled by an administrator."}
          </p>
          <p className="text-xs opacity-50 mt-8">Waiting for admin to re-enable…</p>
        </div>
      )}
    </div>
  );
}

function Jumpscare({
  imageUrl,
  onDismiss,
}: {
  imageUrl: string;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState<"flash" | "scare" | "calm">("flash");

  useEffect(() => {
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ac = new Ctx();

      const master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);

      [180, 260, 410, 720].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = i % 2 ? "square" : "sawtooth";
        o.frequency.setValueAtTime(f, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(
          f * 8,
          ac.currentTime + 0.5
        );
        o.frequency.exponentialRampToValueAtTime(
          f * 0.6,
          ac.currentTime + 2.4
        );
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(
          0.45,
          ac.currentTime + 0.04
        );
        g.gain.exponentialRampToValueAtTime(
          0.0001,
          ac.currentTime + 2.6
        );
        o.connect(g).connect(master);
        o.start();
        o.stop(ac.currentTime + 2.6);
      });

      const buf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

      const noise = ac.createBufferSource();
      noise.buffer = buf;
      const ng = ac.createGain();
      ng.gain.value = 0.5;
      noise.connect(ng).connect(master);
      noise.start();

      if (navigator.vibrate)
        navigator.vibrate([400, 60, 600, 60, 800, 60, 400]);
    } catch {}

    const t1 = setTimeout(() => setPhase("scare"), 100);
    const t2 = setTimeout(() => setPhase("calm"), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center cursor-pointer"
      onClick={onDismiss}
    >
      <div
        className="absolute inset-0"
        style={{
          background: phase === "flash" ? "white" : "black",
          animation:
            phase === "scare"
              ? "phraseFade 0.12s linear infinite"
              : undefined,
        }}
      />

      {phase !== "flash" && (
        <div
          className="relative text-center w-full h-full flex flex-col items-center justify-center"
          style={{
            animation:
              phase === "scare"
                ? "scareShake 0.06s linear infinite"
                : undefined,
          }}
        >
          <img
            src={imageUrl}
            alt=""
            className="w-screen h-screen object-cover absolute inset-0"
            style={{
              filter:
                phase === "scare"
                  ? "contrast(1.6) saturate(1.6) brightness(1.1)"
                  : "none",
            }}
          />
          <p
            className="relative mt-3 text-red-600 text-5xl md:text-8xl font-black tracking-widest"
            style={{
              textShadow:
                "0 0 32px red, 0 0 12px white, 0 0 60px black",
            }}
          >
            BOO!
          </p>
          {phase === "calm" && (
            <p className="text-white/70 text-xs mt-2">
              click anywhere to dismiss
            </p>
          )}
        </div>
      )}
    </div>
  );
}
