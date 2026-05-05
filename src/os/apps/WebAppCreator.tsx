import { useRef, useState } from "react";
import { useOS } from "../store";
import { Trash2, Globe } from "lucide-react";

export function WebAppCreator() {
  const os = useOS();
  const me = os.state.users.find(u => u.username === os.state.currentUser);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [color, setColor] = useState("#5e9bf5");
  const [icon, setIcon] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  function readIcon(f: File) {
    const r = new FileReader();
    r.onload = () => setIcon(r.result as string);
    r.readAsDataURL(f);
  }

  function create() {
    if (!name.trim() || !url.trim()) return;
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    os.addWebApp({ name: name.trim(), url: u, icon, color });
    setName(""); setUrl("https://"); setIcon(undefined);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6" /> Web App Creator</h1>
      <p className="text-sm os-text-muted">Turn any website into a desktop app with its own icon.</p>

      <section className="liquid-glass rounded-3xl p-5 space-y-4">
        <div>
          <div className="text-xs os-text-muted mb-1">Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="YouTube"
            className="w-full bg-white/10 rounded-2xl px-4 py-2 text-sm outline-none border border-white/20" />
        </div>
        <div>
          <div className="text-xs os-text-muted mb-1">URL</div>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com"
            className="w-full bg-white/10 rounded-2xl px-4 py-2 text-sm outline-none border border-white/20" />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs os-text-muted mb-1">Tint</div>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border border-white/20" />
          </div>
          <div className="flex-1">
            <div className="text-xs os-text-muted mb-1">Icon (optional)</div>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Upload Icon</button>
              {icon && <img src={icon} alt="" className="w-10 h-10 rounded-[12px] object-cover" />}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) readIcon(f); }} />
            </div>
          </div>
        </div>
        <button onClick={create} className="px-5 py-2 rounded-2xl os-accent-bg text-white text-sm font-medium">Create Web App</button>
      </section>

      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Your Web Apps</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(me?.webApps || []).length === 0 && <div className="text-xs os-text-muted">No web apps yet.</div>}
          {(me?.webApps || []).map(w => (
            <div key={w.id} className="liquid-glass rounded-2xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] grid place-items-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${w.color || "#5e9bf5"}, ${(w.color || "#5e9bf5")}cc)` }}>
                {w.icon ? <img src={w.icon} alt="" className="w-full h-full object-cover" /> : <Globe className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{w.name}</div>
                <div className="text-[10px] os-text-muted truncate">{w.url}</div>
              </div>
              <button onClick={() => os.removeWebApp(w.id)} className="p-2 rounded-xl hover:bg-white/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}