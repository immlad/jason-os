import { useOS } from "../store";
import { themeLabels, wallpapers } from "../themes";
import type { ThemeName } from "../types";

export function Settings() {
  const os = useOS();
  const themes: ThemeName[] = ["cloud", "night", "forest", "jason"];
  if (os.state.sebastianUnlocked) themes.push("sebastian");

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section>
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Appearance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => os.setTheme(t)}
              className={`relative rounded-xl overflow-hidden aspect-video group transition-all ${
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
        <h2 className="text-sm font-semibold os-text-muted mb-3 uppercase tracking-wide">Account</h2>
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">{os.state.currentUser}</div>
            <div className="text-xs os-text-muted">
              {os.state.users.find(u => u.username === os.state.currentUser)?.isAdmin ? "Administrator" : "Standard user"}
            </div>
          </div>
          <button onClick={() => os.logout()} className="px-3 py-1.5 rounded-lg os-accent-bg text-white text-sm font-medium">
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}