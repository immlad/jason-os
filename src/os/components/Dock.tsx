import { LucideIcon } from "lucide-react";
import { jasonImg } from "../themes";
import { useOS } from "../store";

export interface DockItem {
  id: string;
  name: string;
  Icon: LucideIcon;
  color: string;
}

export function Dock({ items, onOpen }: { items: DockItem[]; onOpen: (id: string) => void }) {
  const os = useOS();
  const isJason = os.state.theme === "jason";
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-strong rounded-2xl px-3 py-2 flex items-end gap-2 shadow-2xl">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="group relative w-14 h-14 rounded-xl grid place-items-center transition-transform hover:-translate-y-2 hover:scale-110 duration-200"
            style={{ background: isJason ? "transparent" : `linear-gradient(135deg, ${it.color}, ${it.color}dd)` }}
            aria-label={it.name}
          >
            {isJason ? (
              <img src={jasonImg} alt={it.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <it.Icon className="w-7 h-7 text-white drop-shadow" />
            )}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md glass-strong text-[11px] os-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {it.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}