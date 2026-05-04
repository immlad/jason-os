import { useState } from "react";
import { useOS } from "../store";

export function AdminPanel() {
  const os = useOS();
  const [global, setGlobal] = useState("");
  const [trollImg, setTrollImg] = useState("");
  const [trollTarget, setTrollTarget] = useState("");

  const me = os.state.users.find(u => u.username === os.state.currentUser);
  if (!me?.isAdmin) {
    return <div className="p-8 os-text-muted">Access denied. Admins only.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

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
            onClick={() => { if (global.trim()) { os.sendGlobal(global); setGlobal(""); } }}
            className="px-4 py-2 rounded-lg os-accent-bg text-white text-sm font-medium"
          >Send</button>
        </div>
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
            placeholder="Image URL"
            className="bg-transparent border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "hsl(var(--os-border))" }}
          />
        </div>
        <button
          onClick={() => { if (trollTarget && trollImg) { os.troll(trollTarget, trollImg); setTrollImg(""); }}}
          className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium"
        >Troll 'em</button>
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