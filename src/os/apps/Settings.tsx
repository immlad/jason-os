import { useRef } from "react";
import { useOS } from "../store";
import { themeLabels, wallpapers } from "../themes";
import type { ThemeName } from "../types";

export function Settings() {
  const os = useOS();
  const me = os.state.users.find(u => u.id === os.state.currentUserId);
  const wpRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);
  const scareRef = useRef<HTMLInputElement>(null);
  const themes: ThemeName[] = ["cloud", "night", "forest", "jason"];
  if (os.state.sebastianUnlocked) themes.push("sebastian");
  if (os.state.leoUnlocked) themes.push("leo");
  if (os.state.jasonCatUnlocked) themes.push("jasoncat");

  function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function openBlank() {
    const w = window.open("about:blank", "_blank");
    if (!w) return;
    w.document.title = "JASON OS";
    w.location.href = window.location.href;
  }
  function openBlob() {
    const html = `<!doctype html><meta charset=utf-8><title>JASON OS</title><style>html,body,iframe{margin:0;padding:0;border:0;width:100%;height:100%}</style><iframe src="${window.location.href}" allow="fullscreen"></iframe>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank");
  }

  return (
    <div className="p-8 space-y-8 rounded-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Appearance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => os.setTheme(t)}
              className={`relative rounded-3xl overflow-hidden aspect-video group transition-all ${
                os.state.theme === t ? "ring-2 ring-offset-2" : "ring-1"
              }`}
              style={{ borderColor: "hsl(var(--os-accent))" }}
            >
              <img src={wallpapers[t]} alt={t} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute bottom-0 inset-x-0 p-2 text-xs font-medium text-white bg-gradient-to-t from-black/70 to-transparent text-left">
                {themeLabels[t]}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Personalization</h2>
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-medium">Custom Wallpaper</div>
              <div className="text-xs os-text-muted">Overrides the theme wallpaper for your account</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => wpRef.current?.click()} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Upload</button>
              {me?.customWallpaper && (
                <button onClick={() => os.setCustomWallpaper(null)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Remove</button>
              )}
              <input ref={wpRef} type="file" accept="image/*" hidden onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                os.setCustomWallpaper(await readFile(f));
              }} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-medium">Custom Font</div>
              <div className="text-xs os-text-muted">{me?.customFont ? `Active: ${me.customFont.name}` : ".ttf, .otf, .woff, .woff2"}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fontRef.current?.click()} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Upload</button>
              {me?.customFont && (
                <button onClick={() => os.setCustomFont(null)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Remove</button>
              )}
              <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/*" hidden onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                os.setCustomFont({ name: f.name, dataUrl: await readFile(f) });
              }} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {me?.customJumpscare ? (
                <img src={me.customJumpscare} alt="jumpscare preview" className="w-14 h-14 rounded-xl object-cover border border-white/30" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 grid place-items-center text-lg">👻</div>
              )}
              <div>
                <div className="text-sm font-medium">Custom Jumpscare</div>
                <div className="text-xs os-text-muted">{me?.customJumpscare ? "Active — used by the scare overlay" : "Upload an image to replace the default scare"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scareRef.current?.click()} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Upload</button>
              {me?.customJumpscare && (
                <button onClick={() => os.setCustomJumpscare(null)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs">Remove</button>
              )}
              <input ref={scareRef} type="file" accept="image/*" hidden onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                os.setCustomJumpscare(await readFile(f));
              }} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Open JASON OS</h2>
        <div className="glass rounded-3xl p-5 flex gap-3 flex-wrap">
          <button onClick={openBlank} className="px-4 py-2 rounded-2xl os-accent-bg text-white text-sm">Open in about:blank</button>
          <button onClick={openBlob} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-sm">Open in blob:</button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Dock</h2>
        <div className="glass rounded-3xl p-5 space-y-4">
          <div>
            <div className="text-xs os-text-muted mb-2">Position</div>
            <div className="flex gap-2">
              {(["top","left","bottom","right"] as const).map(s => (
                <button key={s} onClick={() => os.setDockSide(s)}
                  className={`px-4 py-2 rounded-2xl text-xs capitalize ${os.state.dockSide === s ? "os-accent-bg text-white" : "bg-white/10 hover:bg-white/20"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs os-text-muted mb-2">Shape</div>
            <div className="flex gap-2">
              {(["pill","rounded","square"] as const).map(s => (
                <button key={s} onClick={() => os.setDockShape(s)}
                  className={`px-4 py-2 rounded-2xl text-xs capitalize ${os.state.dockShape === s ? "os-accent-bg text-white" : "bg-white/10 hover:bg-white/20"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Account</h2>
        <div className="glass rounded-3xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold">{os.state.currentUser}</div>
            <div className="text-xs os-text-muted">
              {me?.isAdmin ? "Administrator" : "Standard user"}
            </div>
          </div>
          <button onClick={() => os.logout()} className="px-4 py-2 rounded-2xl os-accent-bg text-white text-sm font-medium hover:brightness-110 transition">
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}