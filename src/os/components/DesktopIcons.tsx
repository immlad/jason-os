import { useEffect, useRef } from "react";
import { useOS } from "../store";
import { jasonImg } from "../themes";
import type { DockItem } from "./Dock";

interface Props {
  items: (DockItem & { title: string })[];
  onOpen: (id: string) => void;
}

export function DesktopIcons({ items, onOpen }: Props) {
  const os = useOS();
  const isJason = os.state.theme === "jason";

  return (
    <div className="absolute inset-0 pointer-events-none">
      {items.map((it, idx) => {
        const def = { x: window.innerWidth - 110, y: 50 + idx * 96 };
        const pos = os.state.desktopIcons[it.id] || def;
        return <Icon key={it.id} item={it} pos={pos} onOpen={() => onOpen(it.id)} isJason={isJason} />;
      })}
    </div>
  );
}

function Icon({ item, pos, onOpen, isJason }: { item: DockItem & { title: string }; pos: { x: number; y: number }; onOpen: () => void; isJason: boolean }) {
  const os = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ox: number; oy: number; moved: boolean } | null>(null);

  useEffect(() => {
    function move(e: MouseEvent) {
      if (!drag.current) return;
      drag.current.moved = true;
      os.setDesktopIcon(item.id, { x: e.clientX - drag.current.ox, y: e.clientY - drag.current.oy });
    }
    function up() {
      if (drag.current && !drag.current.moved) onOpen();
      drag.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [item.id, onOpen, os]);

  return (
    <div
      ref={ref}
      className="absolute w-20 flex flex-col items-center gap-1 pointer-events-auto cursor-pointer group"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => { drag.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y, moved: false }; }}
      onDoubleClick={onOpen}
    >
      <div
        className="w-14 h-14 rounded-2xl grid place-items-center shadow-lg group-hover:scale-105 transition-transform"
        style={{ background: isJason ? "transparent" : `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}
      >
        {isJason ? (
          <img src={jasonImg} alt={item.name} className="w-full h-full rounded-2xl object-cover" />
        ) : (
          <item.Icon className="w-7 h-7 text-white drop-shadow" />
        )}
      </div>
      <div className="text-xs text-white font-medium px-1.5 py-0.5 rounded text-center" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
        {item.name}
      </div>
    </div>
  );
}