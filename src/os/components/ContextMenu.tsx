import { useEffect } from "react";

export interface MenuEntry {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose: () => void }) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("click", h);
    window.addEventListener("contextmenu", h);
    window.addEventListener("blur", h);
    return () => {
      window.removeEventListener("click", h);
      window.removeEventListener("contextmenu", h);
      window.removeEventListener("blur", h);
    };
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - items.length * 32 - 16);

  return (
    <div
      className="fixed z-[200] min-w-[200px] liquid-glass rounded-xl p-1 shadow-2xl animate-menu-pop"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className="h-px bg-white/15 my-1" />
        ) : (
          <button
            key={i}
            disabled={it.disabled}
            onClick={() => { it.onClick?.(); onClose(); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 ${it.danger ? "text-red-300" : "os-text"} ${it.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {it.label}
          </button>
        )
      )}
    </div>
  );
}