import { Wifi, Bluetooth, Moon, Sun, Volume2, Airplay } from "lucide-react";
import { useOS } from "../store";
import { themeLabels } from "../themes";
import type { ThemeName } from "../types";

export function ControlCenter({ onClose }: { onClose: () => void }) {
  const os = useOS();
  const themes: ThemeName[] = ["cloud", "night", "forest", "jason"];
  if (os.state.sebastianUnlocked) themes.push("sebastian");

  return (
    <div className="fixed top-9 right-2 w-80 liquid-glass rounded-3xl p-3 z-50 animate-fade-up shadow-2xl os-text">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs"><Wifi className="w-4 h-4" /> Wi-Fi</div>
          <div className="text-[10px] os-text-muted">JASON-5G</div>
        </div>
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs"><Bluetooth className="w-4 h-4" /> Bluetooth</div>
          <div className="text-[10px] os-text-muted">On</div>
        </div>
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs"><Airplay className="w-4 h-4" /> AirDrop</div>
          <div className="text-[10px] os-text-muted">Contacts</div>
        </div>
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs"><Moon className="w-4 h-4" /> Focus</div>
          <div className="text-[10px] os-text-muted">Off</div>
        </div>
      </div>
      <div className="glass rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 text-xs mb-2"><Sun className="w-4 h-4" /> Display</div>
        <input type="range" defaultValue={80} className="w-full accent-[hsl(var(--os-accent))]" />
      </div>
      <div className="glass rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 text-xs mb-2"><Volume2 className="w-4 h-4" /> Sound</div>
        <input type="range" defaultValue={60} className="w-full accent-[hsl(var(--os-accent))]" />
      </div>
      <div className="glass rounded-xl p-3">
        <div className="text-xs font-semibold mb-2">Theme</div>
        <div className="grid grid-cols-5 gap-1">
          {themes.map(t => (
            <button
              key={t}
              onClick={() => os.setTheme(t)}
              className={`text-[10px] py-1 rounded ${os.state.theme === t ? "os-accent-bg text-white" : "bg-white/10 hover:bg-white/20"}`}
            >{themeLabels[t]}</button>
          ))}
        </div>
      </div>
    </div>
  );
}