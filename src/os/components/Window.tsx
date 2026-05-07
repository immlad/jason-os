import { ReactNode, useEffect, useRef, useState } from "react";
import { X, Minus, Square } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  z: number;
  initial?: { x: number; y: number; w: number; h: number };
  children: ReactNode;
}

export function Window({ title, onClose, onFocus, z, initial, children }: Props) {
  const [pos, setPos] = useState(() => ({
    x: initial?.x ?? 120 + Math.random() * 80,
    y: initial?.y ?? 80 + Math.random() * 60,
  }));
  const [size, setSize] = useState(() => ({
    w: initial?.w ?? 720,
    h: initial?.h ?? 480,
  }));
  const [maxed, setMaxed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const style = fullscreen
    ? { left: 0, top: 0, width: "100vw", height: "100vh", borderRadius: 0 }
    : maxed
    ? { left: 0, top: 28, width: "100vw", height: "calc(100vh - 28px - 90px)" }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h };

  // Notify Desktop to hide dock/menubar when this window is fullscreen
  useEffect(() => {
    if (fullscreen) {
      window.dispatchEvent(new CustomEvent("jason-fullscreen", { detail: true }));
      return () => window.dispatchEvent(new CustomEvent("jason-fullscreen", { detail: false }));
    }
  }, [fullscreen]);

  function toggleFullscreen() {
    setFullscreen(f => !f);
    setMaxed(false);
  }

  return (
    <div
      className="absolute liquid-glass rounded-2xl overflow-hidden shadow-2xl animate-window-open flex flex-col"
      style={{ ...style, zIndex: z, boxShadow: "0 30px 80px hsl(var(--os-shadow))" }}
      onMouseDown={onFocus}
    >
      {/* Titlebar */}
      <div
        className="h-9 flex items-center px-3 gap-2 select-none cursor-move border-b"
        style={{ borderColor: "hsl(var(--os-border))" }}
        onMouseDown={(e) => {
          if (maxed || fullscreen) return;
          dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
        }}
        onDoubleClick={toggleFullscreen}
      >
        {/* Buttons must stay clickable */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 grid place-items-center group"
            aria-label="Close"
          >
            <X className="w-2 h-2 opacity-0 group-hover:opacity-100 text-black" />
          </button>
          <button
            onClick={() => { setMaxed(false); setFullscreen(false); }}
            className="w-3 h-3 rounded-full bg-[#febc2e]"
            aria-label="Minimize"
          >
            <Minus className="w-2 h-2 opacity-0 hover:opacity-100" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-3 h-3 rounded-full bg-[#28c840]"
            aria-label="Fullscreen"
          >
            <Square className="w-2 h-2 opacity-0 hover:opacity-100" />
          </button>
        </div>

        {/* Title should NOT block clicks */}
        <div className="flex-1 text-center text-xs font-medium os-text pointer-events-none">
          {title}
        </div>

        <div className="w-12" />
      </div>

      {/* Content area MUST accept clicks */}
      <div className="flex-1 overflow-auto os-text pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
