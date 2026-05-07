import { useMemo, useRef, useState } from "react";
import { useOS } from "../store";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Radio, Users as UsersIcon, MessageSquare, Skull, Eye } from "lucide-react";

export function AdminPanel() {
  const os = useOS();
  const [global, setGlobal] = useState("");
  const [trollImg, setTrollImg] = useState("");
  const [trollTarget, setTrollTarget] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "users" | "broadcast" | "activity">("live");
  const fileRef = useRef<HTMLInputElement>(null);

  const me = os.state.users.find(u => u.id === os.state.currentUserId);
  if (!me?.isAdmin) return <div className="p-8 os-text-muted">Access denied. Admins only.</div>;

  function flash(msg: string) { setStatus(msg); setTimeout(() => setStatus(null), 2500); }
  async function safe(label: string, fn: () => Promise<any>) {
    try {
      const r = await fn();
      if (r && (r as any).error) throw (r as any).error;
      flash(`✅ ${label}`);
    } catch (e: any) {
      console.error(label, e);
      flash(`❌ ${label}: ${e?.message || e}`);
    }
  }
  function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
  }

  const now = Date.now();
  const liveList = Object.values(os.state.liveUsers)
    .map(p => ({ ...p, online: now - p.lastSeen < 8000 }))
    .sort((a, b) => Number(b.online) - Number(a.online) || b.lastSeen - a.lastSeen);

  const TabBtn = ({ id, icon: Icon, label }: any) => (
    <button onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${tab === id ? "os-accent-bg text-white" : "bg-white/10 hover:bg-white/20"}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="w-6 h-6 text-red-500 animate-pulse" /> Admin Panel</h1>
        {status && <div className="text-xs px-3 py-1.5 rounded-full bg-green-500/80 text-white animate-fade-up">{status}</div>}
      </div>

      <div className="flex gap-2 flex-wrap">
        <TabBtn id="live" icon={Eye} label={`Live Users (${liveList.filter(l => l.online).length})`} />
        <TabBtn id="activity" icon={Activity} label="Activity Feed" />
        <TabBtn id="broadcast" icon={MessageSquare} label="Broadcast & Troll" />
        <TabBtn id="users" icon={UsersIcon} label="Users" />
      </div>

      {tab === "live" && (
        <section className="glass rounded-xl p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4" /> Live Users</h2>
          {liveList.length === 0 && <div className="text-xs os-text-muted">No active users yet.</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            {liveList.map(u => (
              <div key={u.userId} className="rounded-xl p-3 border" style={{ background: "hsl(var(--os-glass))", borderColor: "hsl(var(--os-border))" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${u.online ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className="font-semibold">{u.username}</span>
                  </div>
                  <span className="text-[10px] os-text-muted">{u.online ? "online" : `${Math.round((now - u.lastSeen)/1000)}s ago`}</span>
                </div>
                <div className="text-xs os-text-muted mt-1.5 space-y-0.5">
                  <div>📱 App: <span className="os-text font-medium">{u.currentApp || "Desktop"}</span></div>
                  <div>🌐 Route: {u.route || "/"}</div>
                  <div>🖱 ({u.mouseX},{u.mouseY}) · viewport {u.viewportW}×{u.viewportH}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setTrollTarget(u.userId); setTab("broadcast"); }}
                    className="text-[10px] px-2 py-1 rounded bg-pink-500 text-white">Jumpscare</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="glass rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Activity Feed</h2>
          {os.state.activityFeed.length === 0 && <div className="text-xs os-text-muted">No activity recorded.</div>}
          <div className="space-y-1 max-h-[420px] overflow-auto">
            {os.state.activityFeed.map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5">
                <div><span className="font-semibold">{a.username}</span> <span className="os-text-muted">·</span> <span className="px-1.5 py-0.5 rounded bg-white/10">{a.type}</span> {a.detail && <span className="os-text-muted ml-1">{a.detail}</span>}</div>
                <span className="os-text-muted">{new Date(a.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "broadcast" && (
        <>
          <section className="glass rounded-xl p-4 space-y-2">
            <h2 className="font-semibold">Send Global Message</h2>
            <div className="flex gap-2">
              <input value={global} onChange={(e) => setGlobal(e.target.value)} placeholder="Broadcast to all users..."
                className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "hsl(var(--os-border))" }} />
              <button onClick={async () => {
                if (!global.trim()) { flash("Enter a message first"); return; }
                await safe("Broadcast sent", () => os.sendGlobal(global.trim()));
                setGlobal("");
              }} className="px-4 py-2 rounded-lg os-accent-bg text-white text-sm font-medium">Send</button>
            </div>
            <div className="text-xs os-text-muted">Appears instantly on every user's screen via realtime.</div>
          </section>

          <section className="glass rounded-xl p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Skull className="w-4 h-4" /> Troll a User</h2>
            <div className="grid grid-cols-2 gap-2">
              <select value={trollTarget} onChange={(e) => setTrollTarget(e.target.value)}
                className="bg-transparent border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "hsl(var(--os-border))" }}>
                <option value="">Select user...</option>
                {os.state.users.filter(u => u.id !== me.id).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
              <input value={trollImg} onChange={(e) => setTrollImg(e.target.value)} placeholder="Image URL (optional)"
                className="bg-transparent border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "hsl(var(--os-border))" }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs">Upload image…</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return; setTrollImg(await readFile(f)); flash("Image attached");
              }} />
              <button onClick={async () => {
                if (!trollTarget) { flash("Pick a user first"); return; }
                await safe("Jumpscare delivered", () => os.troll(trollTarget, trollImg || ""));
                setTrollImg("");
              }} className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium">Troll 'em</button>
            </div>
            {trollImg && <img src={trollImg} alt="" className="w-24 h-24 rounded-lg object-cover border border-white/30" />}
          </section>
        </>
      )}

      {tab === "users" && (
        <section className="glass rounded-xl p-4">
          <h2 className="font-semibold mb-3">All Users ({os.state.users.length})</h2>
          <div className="space-y-2">
            {os.state.users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "hsl(var(--os-glass))" }}>
                <div>
                  <span className="font-medium">{u.username}</span>
                  {u.isAdmin && <span className="ml-2 text-xs px-2 py-0.5 rounded os-accent-bg text-white">Admin</span>}
                  {u.banned && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-500 text-white">Banned</span>}
                  {os.state.liveUsers[u.username] && now - os.state.liveUsers[u.username].lastSeen < 8000 && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500 text-white">● live</span>
                  )}
                </div>
                {u.id !== me.id && (
                  <div className="flex gap-2">
                    {!u.isAdmin && <button onClick={() => safe(`${u.username} promoted`, () => os.makeAdmin(u.id))} className="text-xs px-2 py-1 rounded bg-blue-500 text-white">Make Admin</button>}
                    {u.isAdmin && u.id !== me.id && <button onClick={() => safe(`${u.username} demoted`, async () => { const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role","admin"); if (error) throw error; })} className="text-xs px-2 py-1 rounded bg-yellow-600 text-white">Remove Admin</button>}
                    {!u.banned && <button onClick={() => safe(`${u.username} banned`, () => os.ban(u.id))} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Ban</button>}
                    {u.banned && <button onClick={() => safe(`${u.username} unbanned`, async () => { const { error } = await supabase.from("profiles").update({ banned: false }).eq("id", u.id); if (error) throw error; })} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Unban</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
