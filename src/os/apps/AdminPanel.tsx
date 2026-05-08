import { useMemo, useRef, useState } from "react";
import { useOS } from "../store";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Radio, Users as UsersIcon, MessageSquare, Skull, Eye, Lock, Unlock, Monitor } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function AdminPanel() {
  const os = useOS();
  const [global, setGlobal] = useState("");
  const [gTextSize, setGTextSize] = useState(28);
  const [gBoxSize, setGBoxSize] = useState<"sm"|"md"|"lg"|"xl"|"full">("lg");
  const [gDuration, setGDuration] = useState(6);
  const [trollImg, setTrollImg] = useState("");
  const [trollTarget, setTrollTarget] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("live");
  const [mirrorUserId, setMirrorUserId] = useState<string | null>(null);
  const [lockMsg, setLockMsg] = useState("");
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

  const mirrorUser = mirrorUserId
    ? Object.values(os.state.liveUsers).find(p => p.userId === mirrorUserId)
    : null;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="w-6 h-6 text-red-500 animate-pulse" /> Admin Panel</h1>
        {status && <div className="text-xs px-3 py-1.5 rounded-full bg-green-500/80 text-white animate-fade-up">{status}</div>}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-white/10 p-1">
          <TabsTrigger value="live" className="gap-1.5"><Eye className="w-3.5 h-3.5" />Live ({liveList.filter(l => l.online).length})</TabsTrigger>
          <TabsTrigger value="mirror" className="gap-1.5"><Monitor className="w-3.5 h-3.5" />Screen Mirror</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><Activity className="w-3.5 h-3.5" />Activity</TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Broadcast & Troll</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><UsersIcon className="w-3.5 h-3.5" />Users</TabsTrigger>
        </TabsList>

      <TabsContent value="live" forceMount hidden={tab !== "live"}>
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
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button onClick={() => { setMirrorUserId(u.userId); setTab("mirror"); }}
                    className="text-[10px] px-2 py-1 rounded bg-blue-500 text-white">👁 View Screen</button>
                  <button onClick={() => { setTrollTarget(u.userId); setTab("broadcast"); }}
                    className="text-[10px] px-2 py-1 rounded bg-pink-500 text-white">Jumpscare</button>
                  {(() => {
                    const profile = os.state.users.find(x => x.id === u.userId);
                    const locked = profile?.screenLocked;
                    return locked ? (
                      <button onClick={() => safe(`${u.username} unlocked`, () => os.unlockScreen(u.userId))}
                        className="text-[10px] px-2 py-1 rounded bg-green-600 text-white flex items-center gap-1"><Unlock className="w-3 h-3" />Re-enable</button>
                    ) : (
                      <button onClick={() => safe(`${u.username} screen locked`, () => os.lockScreen(u.userId, "Your screen has been disabled by an admin."))}
                        className="text-[10px] px-2 py-1 rounded bg-red-600 text-white flex items-center gap-1"><Lock className="w-3 h-3" />Shut Down</button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="mirror" forceMount hidden={tab !== "mirror"}>
        <section className="glass rounded-xl p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Monitor className="w-4 h-4" /> Live Screen Mirror</h2>
          <select value={mirrorUserId || ""} onChange={(e) => setMirrorUserId(e.target.value || null)}
            className="bg-transparent border rounded-lg px-3 py-2 text-sm w-full" style={{ borderColor: "hsl(var(--os-border))" }}>
            <option value="">Select a live user…</option>
            {liveList.filter(l => l.online).map(u => <option key={u.userId} value={u.userId}>{u.username} — {u.currentApp || "Desktop"}</option>)}
          </select>
          {mirrorUser ? (
            <div className="space-y-2">
              <div className="text-xs os-text-muted grid grid-cols-2 gap-1">
                <div>👤 <b>{mirrorUser.username}</b></div>
                <div>📱 {mirrorUser.currentApp || "Desktop"}</div>
                <div>🌐 {mirrorUser.route}</div>
                <div>🖥 {mirrorUser.viewportW}×{mirrorUser.viewportH}</div>
              </div>
              <div className="relative rounded-xl overflow-hidden border-2 border-red-500/50 bg-black"
                style={{ aspectRatio: `${mirrorUser.viewportW || 16}/${mirrorUser.viewportH || 9}` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-black flex items-center justify-center">
                  <div className="text-center text-white/80 space-y-1">
                    <Monitor className="w-12 h-12 mx-auto opacity-50" />
                    <div className="text-sm">{mirrorUser.username}'s screen</div>
                    <div className="text-xs opacity-70">In: {mirrorUser.currentApp || "Desktop"}</div>
                  </div>
                </div>
                {/* live mouse cursor */}
                {mirrorUser.mouseX != null && mirrorUser.viewportW && (
                  <div className="absolute w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg pointer-events-none transition-all duration-300"
                    style={{
                      left: `${(mirrorUser.mouseX / (mirrorUser.viewportW || 1)) * 100}%`,
                      top: `${(mirrorUser.mouseY! / (mirrorUser.viewportH || 1)) * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }} />
                )}
                <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">● LIVE</div>
              </div>
              <div className="text-[10px] os-text-muted">Updates every ~1.5s. Mouse cursor reflects target user in real time.</div>
            </div>
          ) : <div className="text-xs os-text-muted">Pick an online user above to mirror their screen.</div>}
        </section>
      </TabsContent>

      <TabsContent value="activity" forceMount hidden={tab !== "activity"}>
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
      </TabsContent>

      <TabsContent value="broadcast" forceMount hidden={tab !== "broadcast"} className="space-y-4">
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

        <section className="glass rounded-xl p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Shut Down a Screen</h2>
          <input value={lockMsg} onChange={(e) => setLockMsg(e.target.value)} placeholder="Lock message (optional)"
            className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "hsl(var(--os-border))" }} />
          <div className="grid sm:grid-cols-2 gap-2">
            {os.state.users.filter(u => u.id !== me.id).map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "hsl(var(--os-glass))" }}>
                <span className="text-sm">{u.username} {u.screenLocked && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white">LOCKED</span>}</span>
                {u.screenLocked
                  ? <button onClick={() => safe(`${u.username} re-enabled`, () => os.unlockScreen(u.id))} className="text-xs px-2 py-1 rounded bg-green-600 text-white flex items-center gap-1"><Unlock className="w-3 h-3" />Re-enable</button>
                  : <button onClick={() => safe(`${u.username} screen locked`, () => os.lockScreen(u.id, lockMsg || "Your screen has been disabled by an admin."))} className="text-xs px-2 py-1 rounded bg-red-600 text-white flex items-center gap-1"><Lock className="w-3 h-3" />Shut Down</button>}
              </div>
            ))}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="users" forceMount hidden={tab !== "users"}>
        <section className="glass rounded-xl p-4">
          <h2 className="font-semibold mb-3">All Users ({os.state.users.length})</h2>
          <div className="space-y-2">
            {os.state.users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "hsl(var(--os-glass))" }}>
                <div>
                  <span className="font-medium">{u.username}</span>
                  {u.isAdmin && <span className="ml-2 text-xs px-2 py-0.5 rounded os-accent-bg text-white">Admin</span>}
                  {u.banned && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-500 text-white">Banned</span>}
                  {u.screenLocked && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-orange-500 text-white">Screen Locked</span>}
                  {os.state.liveUsers[u.username] && now - os.state.liveUsers[u.username].lastSeen < 8000 && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500 text-white">● live</span>
                  )}
                </div>
                {u.id !== me.id && (
                  <div className="flex gap-2 flex-wrap">
                    {!u.isAdmin && <button onClick={() => safe(`${u.username} promoted`, () => os.makeAdmin(u.id))} className="text-xs px-2 py-1 rounded bg-blue-500 text-white">Make Admin</button>}
                    {u.isAdmin && u.id !== me.id && <button onClick={() => safe(`${u.username} demoted`, async () => { const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role","admin"); if (error) throw error; })} className="text-xs px-2 py-1 rounded bg-yellow-600 text-white">Remove Admin</button>}
                    {!u.banned && <button onClick={() => safe(`${u.username} banned`, () => os.ban(u.id))} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Ban</button>}
                    {u.banned && <button onClick={() => safe(`${u.username} unbanned`, async () => { const { error } = await supabase.from("profiles").update({ banned: false }).eq("id", u.id); if (error) throw error; })} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Unban</button>}
                    {!u.screenLocked
                      ? <button onClick={() => safe(`${u.username} screen locked`, () => os.lockScreen(u.id))} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Lock Screen</button>
                      : <button onClick={() => safe(`${u.username} screen re-enabled`, () => os.unlockScreen(u.id))} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Unlock Screen</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </TabsContent>
      </Tabs>
    </div>
  );
}
