import { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { themeIconOverride } from "../themes";
import { useOS } from "../store";

export interface DockItem {
  id: string;
  name: string;
  Icon: LucideIcon;
  color: string;
}

interface Props {
  items: DockItem[];
  onOpen: (id: string) => void;
  openIds: string[];
}

export function Dock({ items, onOpen, openIds }: Props) {
  const os = useOS();
  const overrideImg = themeIconOverride(os.state.theme);
  const side = os.state.dockSide;
  const shape = os.state.dockShape;
  const isVertical = side === "left" || side === "right";

  // Order
  const order = os.state.dockOrder.length
    ? [...os.state.dockOrder.filter(id => items.find(i => i.id === id)),
       ...items.filter(i => !os.state.dockOrder.includes(i.id)).map(i => i.id)]
    : items.map(i => i.id);
  const ordered = order.map(id => items.find(i => i.id === id)!).filter(Boolean);

  // Magnification
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [coord, setCoord] = useState<number>(0);

  // Drag reorder
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Dock-side drag
  const [dragSide, setDragSide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragSide) return;
    function move(e: MouseEvent) {
      const w = window.innerWidth, h = window.innerHeight;
      const dxL = e.clientX, dxR = w - e.clientX, dyT = e.clientY, dyB = h - e.clientY;
      const min = Math.min(dxL, dxR, dyT, dyB);
      let s: typeof side = "bottom";
      if (min === dxL) s = "left";
      else if (min === dxR) s = "right";
      else if (min === dyT) s = "top";
      else s = "bottom";
      if (s !== side) os.setDockSide(s);
    }
    function up() { setDragSide(false); }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragSide, side, os]);

  const radiusClass = shape === "pill" ? "rounded-[44px]" : shape === "rounded" ? "rounded-[28px]" : "rounded-2xl";
  const iconRadius = "rounded-[18px]"; // rounded-square always

  // Magnification scale by distance to hover
  function scaleFor(i: number) {
    if (hoverIdx === null) return 1;
    const d = Math.abs(i - hoverIdx);
    if (d === 0) return 1.18;
    if (d === 1) return 1.08;
    return 1;
  }

  function handleReorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = ordered.map(i => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    os.setDockOrder(ids);
  }

  const posClass = side === "bottom"
    ? "bottom-2 left-1/2 -translate-x-1/2"
    : side === "top"
    ? "top-9 left-1/2 -translate-x-1/2"
    : side === "left"
    ? "left-2 top-1/2 -translate-y-1/2"
    : "right-2 top-1/2 -translate-y-1/2";

  return (
    <div className={`fixed ${posClass} z-40`}>
      <div
        ref={containerRef}
        className={`liquid-glass ${radiusClass} shadow-2xl flex ${isVertical ? "flex-col py-4 px-3 items-center" : "flex-row px-5 py-3 items-end"} gap-2`}
        style={{ cursor: dragSide ? "grabbing" : "default" }}
        onMouseLeave={() => setHoverIdx(null)}
        onDoubleClick={() => setDragSide(true)}
        title="Double-click & drag to move dock"
      >
        {ordered.map((it, i) => {
          const scale = scaleFor(i);
          const isOpen = openIds.includes(it.id);
          const isOver = overId === it.id && dragId && dragId !== it.id;
          return (
            <div key={it.id} className="relative flex flex-col items-center">
              <button
                draggable
                onDragStart={() => setDragId(it.id)}
                onDragOver={(e) => { e.preventDefault(); setOverId(it.id); }}
                onDragLeave={() => setOverId(null)}
                onDrop={() => { handleReorder(it.id); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onMouseEnter={() => setHoverIdx(i)}
                onClick={() => onOpen(it.id)}
                className={`group relative w-16 h-16 ${iconRadius} grid place-items-center transition-all duration-200 ease-out ${isOver ? "ring-2 ring-white/60" : ""}`}
                style={{
                  background: overrideImg ? "transparent" : `linear-gradient(135deg, ${it.color}, ${it.color}cc)`,
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  boxShadow: scale > 1 ? "0 8px 18px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.2)",
                }}
                aria-label={it.name}
              >
                {overrideImg ? (
                  <img src={overrideImg} alt={it.name} className={`w-full h-full ${iconRadius} object-cover`} />
                ) : (
                  <it.Icon className="w-7 h-7 text-white drop-shadow" />
                )}
                <span
                  className={`absolute ${
                    side === "bottom" ? "-top-9 left-1/2 -translate-x-1/2" :
                    side === "top" ? "top-full mt-2 left-1/2 -translate-x-1/2" :
                    side === "left" ? "left-full ml-2 top-1/2 -translate-y-1/2" :
                    "right-full mr-2 top-1/2 -translate-y-1/2"
                  } px-2.5 py-1 rounded-md glass-strong text-[11px] os-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium`}
                >
                  {it.name}
                </span>
              </button>
              {isOpen && (
                <span className={`${isVertical ? "absolute" : ""} ${
                  side === "bottom" ? "mt-0.5" :
                  side === "top" ? "order-first mb-0.5" :
                  side === "left" ? "left-0 top-1/2 -translate-y-1/2 -ml-1" :
                  "right-0 top-1/2 -translate-y-1/2 -mr-1"
                } w-1 h-1 rounded-full bg-current opacity-70`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}