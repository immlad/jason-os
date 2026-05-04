import { useEffect, useState } from "react";
import { Wifi, Battery, Search, Bell, Settings2 } from "lucide-react";
import { useOS } from "../store";

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