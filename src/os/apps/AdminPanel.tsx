import { useRef, useState } from "react";
import { useOS } from "../store";

export function AdminPanel() {
  const os = useOS();
  const [global, setGlobal] = useState("");
  const [trollImg, setTrollImg] = useState("");
  const [trollTarget, setTrollTarget] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const me = os.state.users.find(u => u.username === os.state.currentUser);
  if (!me?.isAdmin) {
    return <div className="p-8 os-text-muted">Access denied. Admins only.</div>;
  }

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  }

  function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        {status && <div className="text-xs px-3 py-1.5 rounded-full bg-green-500/80 text-white animate-fade-up">{status}</div>}
      </div>

      <section className="glass rounded-xl p-4 space-y-2">
        <h2 className="font-semibold">Send Global Message</h2>
        <div className="flex gap-2">
          <input
            value={global}
            onChange={(e) => setGlobal(e.target.value)}
            placeholder="Broadcast to all users..."
            className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "hsl(var(--os-border))" }}
          />
          <button
            onClick={() => {
              if (!global.trim()) { flash("Enter a message first"); return; }
              os.sendGlobal(global.trim());
              flash(`📢 Broadcast sent live to all users`);
              setGlobal("");
            }}
            className="px-4 py-2 rounded-lg os-accent-bg text-white text-sm font-medium"
          >Send</button>
        </div>
        <div className="text-xs os-text-muted">Appears instantly on every open tab/window.</div>
      </section>

      <section className="glass rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Troll a User</h2>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={trollTarget}
            onChange={(e) => setTrollTarget(e.target.value)}
            className="bg-transparent border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "hsl(var(--os-border))" }}
          >
            <option value="">Select user...</option>
            {os.state.users.filter(u => u.username !== me.username).map(u => (
              <option key={u.username} value={u.username}>{u.username}</option>
            ))}
          </select>
          <input
            value={trollImg}
            onChange={(e) => setTrollImg(e.target.value)}
            placeholder="Image URL (optional — uses default scare)"
            className="bg-transparent border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "hsl(var(--os-border))" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
          >Upload image…</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            setTrollImg(await readFile(f));
            flash("Image attached");
          }} />
          <button
            onClick={() => {
              if (!trollTarget) { flash("Pick a user first"); return; }
              os.troll(trollTarget, trollImg || "");
              flash(`💀 Jumpscare sent to ${trollTarget}`);
              setTrollImg("");
            }}
            className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium"
          >Troll 'em</button>
        </div>
        {trollImg && <img src={trollImg} alt="" className="w-24 h-24 rounded-lg object-cover border border-white/30" />}
        <div className="text-xs os-text-muted">Fires on the target user's screen the next time they're active.</div>
      </section>

      <section className="glass rounded-xl p-4">
        <h2 className="font-semibold mb-3">Users</h2>
        <div className="space-y-2">
          {os.state.users.map(u => (
            <div key={u.username} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "hsl(var(--os-glass))" }}>
              <div>
                <span className="font-medium">{u.username}</span>
                {u.isAdmin && <span className="ml-2 text-xs px-2 py-0.5 rounded os-accent-bg text-white">Admin</span>}
                {u.banned && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-500 text-white">Banned</span>}
              </div>
              {u.username !== me.username && (
                <div className="flex gap-2">
                  {!u.isAdmin && (
                    <button onClick={() => os.makeAdmin(u.username)} className="text-xs px-2 py-1 rounded bg-blue-500 text-white">Make Admin</button>
                  )}
                  {!u.banned && (
                    <button onClick={() => os.ban(u.username)} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Ban</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}