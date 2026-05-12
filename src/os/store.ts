import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ThemeName, User, GlobalMessage, TrollEvent, WebApp, OSState, PresenceRow, ActivityRow } from "./types";

const defaultState: OSState = {
  users: [],
  currentUser: null,
  currentUserId: null,
  theme: "cloud",
  sebastianUnlocked: false,
  leoUnlocked: false,
  jasonCatUnlocked: false,
  globalMessages: [],
  trollEvents: [],
  dockSide: "bottom",
  dockShape: "pill",
  dockOrder: [],
  desktopIcons: {},
  liveUsers: {},
  activityFeed: [],
  loading: true,
};

let state: OSState = { ...defaultState };
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }
function set(patch: Partial<OSState>) { state = { ...state, ...patch }; emit(); }

function rowToUser(p: any, adminIds: Set<string>): User {
  return {
    id: p.id,
    username: p.username,
    isAdmin: adminIds.has(p.id),
    banned: p.banned,
    theme: p.theme as ThemeName,
    customWallpaper: p.custom_wallpaper || undefined,
    customFont: p.custom_font || undefined,
    customJumpscare: p.custom_jumpscare || undefined,
    webApps: p.web_apps || [],
    pinnedApps: p.pinned_apps || [],
    screenLocked: !!p.screen_locked,
    screenLockMessage: p.screen_lock_message || null,
    points: p.points || 0,
    shopUnlocks: p.shop_unlocks || [],
    achievementsDiscovered: p.achievements_discovered || [],
    achievementsClaimed: p.achievements_claimed || [],
  };
}

let adminIds = new Set<string>();
let profileRows: any[] = [];

async function refreshProfiles() {
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("*"),
  ]);
  adminIds = new Set((roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
  profileRows = profiles || [];
  const users = profileRows.map(p => rowToUser(p, adminIds));
  const me = users.find(u => u.id === state.currentUserId);
  set({
    users,
    theme: me?.theme || state.theme,
    sebastianUnlocked: !!me && !!profileRows.find(p => p.id === me.id)?.sebastian_unlocked,
    leoUnlocked: !!me && !!profileRows.find(p => p.id === me.id)?.leo_unlocked,
    jasonCatUnlocked: !!me && !!profileRows.find(p => p.id === me.id)?.jasoncat_unlocked,
    dockSide: me ? (profileRows.find(p => p.id === me.id)?.dock_side || "bottom") : state.dockSide,
    dockShape: me ? (profileRows.find(p => p.id === me.id)?.dock_shape || "pill") : state.dockShape,
    dockOrder: me ? (profileRows.find(p => p.id === me.id)?.dock_order || []) : state.dockOrder,
    desktopIcons: me ? (profileRows.find(p => p.id === me.id)?.desktop_icons || {}) : state.desktopIcons,
  });
}

async function refreshMessages() {
  const { data } = await supabase.from("global_messages").select("*").order("created_at", { ascending: true }).limit(100);
  set({ globalMessages: (data || []).map((m: any) => ({
    id: m.id, from: m.from_user, text: m.text, ts: new Date(m.created_at).getTime(),
    textSize: m.text_size ?? 18, boxSize: m.box_size ?? "md", durationMs: m.duration_ms ?? 6000,
  })) });
}
async function refreshTrolls() {
  const { data } = await supabase.from("troll_events").select("*").eq("dismissed", false);
  const me = state.currentUserId;
  set({ trollEvents: (data || []).map((t: any) => ({ id: t.id, target: profileRows.find(p => p.id === t.target_id)?.username || "", targetId: t.target_id, imageUrl: t.image_url || "", ts: new Date(t.created_at).getTime() })) });
}
async function refreshPresence() {
  const { data } = await supabase.from("presence").select("*");
  const map: Record<string, PresenceRow> = {};
  for (const p of data || []) {
    map[p.username] = {
      userId: p.user_id, username: p.username,
      currentApp: p.current_app, route: p.route,
      mouseX: p.mouse_x, mouseY: p.mouse_y,
      viewportW: p.viewport_w, viewportH: p.viewport_h,
      lastSeen: new Date(p.last_seen).getTime(),
    };
  }
  set({ liveUsers: map });
}
async function refreshActivity() {
  const { data } = await supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(100);
  set({ activityFeed: (data || []).map((a: any) => ({ id: a.id, userId: a.user_id, username: a.username, type: a.type, detail: a.detail, time: new Date(a.created_at).getTime() })) });
}

let initialized = false;
async function init() {
  if (initialized) return; initialized = true;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) set({ currentUserId: session.user.id, currentUser: session.user.user_metadata?.username || session.user.email?.split("@")[0] || null });
  supabase.auth.onAuthStateChange((_e, s) => {
    if (s?.user) {
      set({ currentUserId: s.user.id, currentUser: s.user.user_metadata?.username || s.user.email?.split("@")[0] || null });
      setTimeout(loadAll, 0);
    } else {
      set({ currentUserId: null, currentUser: null });
    }
  });
  await loadAll();
  set({ loading: false });

  // realtime
  supabase.channel("os-profiles").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshProfiles).subscribe();
  supabase.channel("os-roles").on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, refreshProfiles).subscribe();
  supabase.channel("os-msgs").on("postgres_changes", { event: "*", schema: "public", table: "global_messages" }, refreshMessages).subscribe();
  supabase.channel("os-trolls").on("postgres_changes", { event: "*", schema: "public", table: "troll_events" }, refreshTrolls).subscribe();
  supabase.channel("os-presence").on("postgres_changes", { event: "*", schema: "public", table: "presence" }, refreshPresence).subscribe();
  supabase.channel("os-activity").on("postgres_changes", { event: "*", schema: "public", table: "activity" }, refreshActivity).subscribe();
}
async function loadAll() {
  await refreshProfiles();
  await Promise.all([refreshMessages(), refreshTrolls(), refreshPresence(), refreshActivity()]);
}
if (typeof window !== "undefined") init();

function emailFor(username: string) {
  return `${username.trim().toLowerCase()}@jasonos.local`;
}
async function patchProfile(patch: Record<string, any>) {
  if (!state.currentUserId) return;
  await (supabase.from("profiles") as any).update(patch).eq("id", state.currentUserId);
  await refreshProfiles();
}
async function logActivity(type: string, detail?: string) {
  if (!state.currentUserId || !state.currentUser) return;
  await supabase.from("activity").insert({ user_id: state.currentUserId, username: state.currentUser, type, detail: detail || null });
}

export function useOS() {
  const [, setTick] = useState(0);
  useEffect(() => { const l = () => setTick(t => t + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);

  return {
    state,
    async signup(username: string, password: string) {
      const u = username.trim();
      if (!u || !password) return { ok: false, error: "Username and password required" };
      const { data, error } = await supabase.auth.signUp({
        email: emailFor(u), password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { username: u } },
      });
      if (error) return { ok: false, error: error.message };
      if (data.user) { set({ currentUserId: data.user.id, currentUser: u }); await loadAll(); }
      return { ok: true };
    },
    async login(username: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailFor(username), password });
      if (error) return { ok: false, error: error.message.includes("Invalid") ? "Wrong username or password" : error.message };
      if (data.user) { set({ currentUserId: data.user.id, currentUser: username.trim() }); await loadAll(); }
      return { ok: true };
    },
    async logout() {
      if (state.currentUserId) await supabase.from("presence").delete().eq("user_id", state.currentUserId);
      await supabase.auth.signOut();
      set({ currentUserId: null, currentUser: null });
    },

    setTheme(theme: ThemeName) { set({ theme }); patchProfile({ theme }); },
    setDockSide(dockSide: any) { set({ dockSide }); patchProfile({ dock_side: dockSide }); },
    setDockShape(dockShape: any) { set({ dockShape }); patchProfile({ dock_shape: dockShape }); },
    setDockOrder(dockOrder: string[]) { set({ dockOrder }); patchProfile({ dock_order: dockOrder }); },
    setDesktopIcon(id: string, pos: { x: number; y: number }) {
      const next = { ...state.desktopIcons, [id]: pos };
      set({ desktopIcons: next });
      patchProfile({ desktop_icons: next });
    },
    unlockSebastian() { set({ sebastianUnlocked: true }); patchProfile({ sebastian_unlocked: true }); },
    unlockLeo() { set({ leoUnlocked: true }); patchProfile({ leo_unlocked: true }); },
    unlockJasonCat() { set({ jasonCatUnlocked: true }); patchProfile({ jasoncat_unlocked: true }); },
    setCustomWallpaper(dataUrl: string | null) { patchProfile({ custom_wallpaper: dataUrl }); },
    setCustomFont(font: { name: string; dataUrl: string } | null) { patchProfile({ custom_font: font }); },
    setCustomJumpscare(dataUrl: string | null) { patchProfile({ custom_jumpscare: dataUrl }); },

    async addWebApp(app: Omit<WebApp, "id">) {
      const me = state.users.find(u => u.id === state.currentUserId);
      const next: WebApp[] = [...(me?.webApps || []), { ...app, id: `web-${crypto.randomUUID()}` }];
      await patchProfile({ web_apps: next });
      try { await (supabase as any).rpc("award_points", { _amount: 50, _reason: "create-webapp" }); await refreshProfiles(); } catch {}
    },
    async removeWebApp(id: string) {
      const me = state.users.find(u => u.id === state.currentUserId);
      const next = (me?.webApps || []).filter(w => w.id !== id);
      await patchProfile({ web_apps: next });
    },
    async pinApp(id: string) {
      const me = state.users.find(u => u.id === state.currentUserId);
      const cur = me?.pinnedApps || [];
      if (cur.includes(id)) return;
      await patchProfile({ pinned_apps: [...cur, id] });
    },
    async unpinApp(id: string) {
      const me = state.users.find(u => u.id === state.currentUserId);
      await patchProfile({ pinned_apps: (me?.pinnedApps || []).filter(x => x !== id) });
    },

    async sendGlobal(text: string, opts?: { textSize?: number; boxSize?: string; durationMs?: number }) {
      if (!state.currentUserId || !state.currentUser) return;
      const { error } = await supabase.from("global_messages").insert({
        from_user: state.currentUser, from_id: state.currentUserId, text,
        text_size: opts?.textSize ?? 18, box_size: opts?.boxSize ?? "md", duration_ms: opts?.durationMs ?? 6000,
      } as any);
      if (error) throw error;
      await refreshMessages();
      await logActivity("broadcast", text.slice(0, 80));
    },
    async ban(userId: string) {
      const { error } = await supabase.from("profiles").update({ banned: true }).eq("id", userId);
      if (error) throw error;
      await refreshProfiles();
      await logActivity("ban", profileRows.find(p => p.id === userId)?.username || userId);
    },
    async makeAdmin(userId: string) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
      await refreshProfiles();
      await logActivity("promote", profileRows.find(p => p.id === userId)?.username || userId);
    },
    async troll(targetId: string, imageUrl: string) {
      const { error } = await supabase.from("troll_events").insert({ target_id: targetId, image_url: imageUrl || null });
      if (error) throw error;
      await refreshTrolls();
      await logActivity("troll", profileRows.find(p => p.id === targetId)?.username || targetId);
    },
    async dismissTroll(id: string) {
      await supabase.from("troll_events").update({ dismissed: true }).eq("id", id);
      await refreshTrolls();
    },

    async lockScreen(userId: string, message?: string) {
      const { error } = await supabase.from("profiles").update({ screen_locked: true, screen_lock_message: message || null }).eq("id", userId);
      if (error) throw error;
      await refreshProfiles();
      await logActivity("lock-screen", profileRows.find(p => p.id === userId)?.username || userId);
    },
    async unlockScreen(userId: string) {
      const { error } = await supabase.from("profiles").update({ screen_locked: false, screen_lock_message: null }).eq("id", userId);
      if (error) throw error;
      await refreshProfiles();
      await logActivity("unlock-screen", profileRows.find(p => p.id === userId)?.username || userId);
    },

    async heartbeat(currentApp: string | null, route: string, mx: number, my: number) {
      if (!state.currentUserId || !state.currentUser) return;
      await supabase.from("presence").upsert({
        user_id: state.currentUserId, username: state.currentUser,
        current_app: currentApp, route,
        mouse_x: mx, mouse_y: my,
        viewport_w: window.innerWidth, viewport_h: window.innerHeight,
        last_seen: new Date().toISOString(),
      });
    },
    pushActivity(type: string, detail?: string) { logActivity(type, detail); },

    async awardPoints(amount: number, reason: string) {
      if (!state.currentUserId) return;
      try {
        await (supabase as any).rpc("award_points", { _amount: amount, _reason: reason });
        await refreshProfiles();
      } catch (e) { console.warn("awardPoints failed", e); }
    },

    async purchaseItem(item: string) {
      const { data, error } = await (supabase as any).rpc("purchase_item", { _item: item });
      if (error) throw error;
      await refreshProfiles();
      return data;
    },

    async discoverAchievement(id: string) {
      try {
        await (supabase as any).rpc("discover_achievement", { _id: id });
        await refreshProfiles();
      } catch (e) { console.warn("discover failed", e); }
    },
    async claimAchievement(id: string) {
      const { data, error } = await (supabase as any).rpc("claim_achievement", { _id: id });
      if (error) throw error;
      await refreshProfiles();
      return data;
    },
    async adminResetPoints(userId: string) {
      const { error } = await (supabase as any).rpc("admin_reset_points", { _target: userId });
      if (error) throw error;
      await refreshProfiles();
    },
    async kickUser(userId: string) {
      await supabase.from("presence").delete().eq("user_id", userId);
      await refreshPresence();
    },
    async clearTrollsFor(userId: string) {
      await supabase.from("troll_events").update({ dismissed: true }).eq("target_id", userId).eq("dismissed", false);
      await refreshTrolls();
    },
    async adminSetTheme(userId: string, theme: ThemeName) {
      await (supabase.from("profiles") as any).update({ theme }).eq("id", userId);
      await refreshProfiles();
    },
  };
}
