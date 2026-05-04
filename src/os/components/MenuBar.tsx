import { useEffect, useState } from "react";
import { Wifi, Battery, Search, Bell, Settings2 } from "lucide-react";
import { useOS } from "../store";

function JasonLogo() {
  // Stylized "J" mark — a fake apple-style monochrome glyph
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2.5c.4 1.6 1.7 2.7 3.3 3 .2 1.5-.5 3-1.8 3.7C16 9.6 16 9.9 16 10.3v6.4c0 3-2.3 5.4-5.5 5.4S5 19.7 5 16.7c0-2.6 1.9-4.7 4.4-5.1.7-.1 1.3.5 1.3 1.2 0 .6-.4 1.1-1 1.2-1.5.3-2.6 1.6-2.6 3.1 0 1.7 1.4 3 3.4 3s3.4-1.3 3.4-3V8.6c0-2.3 1.4-4.4 3.5-5.4-.1 0-.2-.1-.3-.1-.7-.2-1.2-.5-1.5-1l1.4-.4z"/>
    </svg>
  );
}

interface Props {
  appName: string;
  onAbout: () => void;
  onToggleControl: () => void;
}

export function MenuBar({ appName, onAbout, onToggleControl }: Props) {
  const os = useOS();
  const [time, setTime] = useState(new Date());
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtTime = time.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="fixed top-0 inset-x-0 h-7 glass z-50 flex items-center px-3 text-xs os-text">
      <div className="relative">
        <button onClick={() => setOpenMenu(openMenu === "apple" ? null : "apple")} className="px-2 py-0.5 hover:bg-white/20 rounded grid place-items-center" aria-label="JASON menu">
          <JasonLogo />
        </button>
        {openMenu === "apple" && (
          <div className="absolute top-7 left-0 glass-strong rounded-lg p-1 min-w-[180px] shadow-xl animate-fade-up">
            <button onClick={() => { onAbout(); setOpenMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/20 rounded text-xs">About JASON OS</button>
            <div className="h-px bg-white/20 my-1" />
            <button onClick={() => { os.logout(); setOpenMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/20 rounded text-xs">Log Out {os.state.currentUser}…</button>
          </div>
        )}
      </div>
      <span className="ml-2 font-semibold">{appName}</span>
      <span className="ml-3 os-text-muted">File  Edit  View  Window  Help</span>
      <div className="flex-1" />
      <button onClick={onToggleControl} className="px-2 py-0.5 hover:bg-white/20 rounded flex items-center gap-2">
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-3.5 h-3.5" />
        <Settings2 className="w-3.5 h-3.5" />
      </button>
      <span className="ml-2">{fmtTime}</span>
    </div>
  );
}