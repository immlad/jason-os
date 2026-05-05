import { useState } from "react";
import { useOS } from "../store";
import { jasonImg } from "../themes";

export function About() {
  const os = useOS();
  const [clicks, setClicks] = useState(0);

  function handleClick() {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 15 && !os.state.sebastianUnlocked) {
      os.unlockSebastian();
    }
  }

  return (
    <div className="p-8 space-y-6 select-none" onClick={handleClick}>
      <div className="flex items-center gap-6">
        <img src={jasonImg} alt="Jason" className="w-24 h-24 rounded-2xl object-cover" />
        <div>
          <h1 className="text-3xl font-bold">JASON OS</h1>
          <p className="os-text-muted">Version 1.0 "Sonoma"</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "hsl(var(--os-border))" }}>
          <span className="os-text-muted">Designed by</span><span>Jason</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "hsl(var(--os-border))" }}>
          <span className="os-text-muted">Memory</span><span>∞ GB</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "hsl(var(--os-border))" }}>
          <span className="os-text-muted">Chip</span><span>JASON M9 Pro Max Ultra</span>
        </div>
      </div>
    </div>
  );
}