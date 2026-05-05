import { useEffect, useState } from "react";
import type { OSState, ThemeName, User, GlobalMessage, TrollEvent, WebApp } from "./types";

const KEY = "jason-os-state-v2";
const LAST_USER_KEY = "jason-os-last-user";
const CHANNEL = "jason-os-sync";
const bc: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL)
    : null;

const defaultState: OSState = {
  users: [],
  currentUser: null,
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

  // NEW LIVE SYSTEM
  liveUsers: {}, // { username: timestamp }
  activityFeed: [], // { user, type, detail, time }
};

function load(): OSState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

let state: OSState = load();
const listeners = new Set<() => void>();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
  try {
    bc?.postMessage({ type: "state", state });
  } catch {}
}

// cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        state = { ...defaultState, ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
      } catch {}
    }
  });

  bc?.addEventListener("message", (e) => {
    if (e.data?.type === "state" && e.data.state) {
      state = { ...defaultState, ...e.data.state };
      listeners.forEach((l) => l());
    }
  });

  // Poll fallback
  setInterval(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const next = JSON.parse(raw);
      if (JSON.stringify(next) !== JSON.stringify(state)) {
        state = { ...defaultState, ...next };
        listeners.forEach((l) => l());
      }
    } catch {}
  }, 1500);
}

export function useOS() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  return {
    state,

    // -------------------------
    // AUTH
    // -------------------------
    signup(username: string, password: string) {
      const u = username.trim();
      if (!u || !password) return { ok: false, error: "Username and password required" };

      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const fresh = JSON.parse(raw);
          if (Array.isArray(fresh.users)) state = { ...state, users: fresh.users };
        }
      } catch {}

      if (state.users.find((x) => x.username.toLowerCase() === u.toLowerCase()))
        return { ok: false, error: "Username already taken" };

      const isAdmin = ["jason", "minh"].includes(u.toLowerCase());
      const user: User = { username: u, password, isAdmin };

      state = { ...state, users: [...state.users, user], currentUser: u };
      try {
        localStorage.setItem(LAST_USER_KEY, u);
      } catch {}
      persist();
      return { ok: true };
    },

    login(username: string, password: string) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const fresh = JSON.parse(raw);
          if (Array.isArray(fresh.users)) state = { ...state, users: fresh.users };
        }
      } catch {}

      const user = state.users.find(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!user) return { ok: false, error: "User not found" };
      if (user.banned) return { ok: false, error: "You have been banned" };
      if (user.password !== password) return { ok: false, error: "Wrong password" };

      state = { ...state, currentUser: user.username };
      try {
        localStorage.setItem(LAST_USER_KEY, user.username);
      } catch {}
      persist();
      return { ok: true };
    },

    logout() {
      state = { ...state, currentUser: null };
      persist();
    },

    // -------------------------
    // THEMES + SETTINGS
    // -------------------------
    setTheme(theme: ThemeName) {
      state = {
        ...state,
        theme,
        users: state.users.map((u) =>
          u.username === state.currentUser ? { ...u, theme } : u
        ),
      };
      persist();
    },

    setDockSide(dockSide) {
      state = { ...state, dockSide };
      persist();
    },

    setDockShape(dockShape) {
      state = { ...state, dockShape };
      persist();
    },

    setDockOrder(dockOrder) {
      state = { ...state, dockOrder };
      persist();
    },

    setDesktopIcon(id, pos) {
      state = {
        ...state,
        desktopIcons: { ...state.desktopIcons, [id]: pos },
      };
      persist();
    },

    unlockSebastian() {
      state = { ...state, sebastianUnlocked: true };
      persist();
    },

    unlockLeo() {
      state = { ...state, leoUnlocked: true };
      persist();
    },

    unlockJasonCat() {
      state = { ...state, jasonCatUnlocked: true };
      persist();
    },

    setCustomWallpaper(dataUrl) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, customWallpaper: dataUrl || undefined }
            : u
        ),
      };
      persist();
    },

    setCustomFont(font) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, customFont: font || undefined }
            : u
        ),
      };
      persist();
    },

    setCustomJumpscare(dataUrl) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, customJumpscare: dataUrl || undefined }
            : u
        ),
      };
      persist();
    },

    // -------------------------
    // WEB APPS
    // -------------------------
    addWebApp(app) {
      const wa: WebApp = { ...app, id: `web-${crypto.randomUUID()}` };
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, webApps: [...(u.webApps || []), wa] }
            : u
        ),
      };
      persist();
    },

    removeWebApp(id) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, webApps: (u.webApps || []).filter((w) => w.id !== id) }
            : u
        ),
      };
      persist();
    },

    pinApp(id) {
      state = {
        ...state,
        users: state.users.map((u) => {
          if (u.username !== state.currentUser) return u;
          const cur = u.pinnedApps || [];
          if (cur.includes(id)) return u;
          return { ...u, pinnedApps: [...cur, id] };
        }),
      };
      persist();
    },

    unpinApp(id) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === state.currentUser
            ? { ...u, pinnedApps: (u.pinnedApps || []).filter((x) => x !== id) }
            : u
        ),
      };
      persist();
    },

    // -------------------------
    // GLOBAL MESSAGES
    // -------------------------
    sendGlobal(text) {
      if (!state.currentUser) return;
      const m: GlobalMessage = {
        id: crypto.randomUUID(),
        from: state.currentUser,
        text,
        ts: Date.now(),
      };
      state = {
        ...state,
        globalMessages: [...state.globalMessages, m].slice(-100),
      };
      persist();
    },

    // -------------------------
    // ADMIN
    // -------------------------
    ban(username) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === username ? { ...u, banned: true } : u
        ),
      };
      persist();
    },

    makeAdmin(username) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === username ? { ...u, isAdmin: true } : u
        ),
      };
      persist();
    },

    troll(target, imageUrl) {
      const t: TrollEvent = {
        id: crypto.randomUUID(),
        target,
        imageUrl,
        ts: Date.now(),
      };
      state = {
        ...state,
        trollEvents: [...state.trollEvents, t].slice(-20),
      };
      persist();
    },

    dismissTroll(id) {
      state = {
        ...state,
        trollEvents: state.trollEvents.filter((t) => t.id !== id),
      };
      persist();
    },

    // -------------------------
    // LIVE SYSTEM (NEW)
    // -------------------------
    userOnline(username) {
      state = {
        ...state,
        liveUsers: {
          ...state.liveUsers,
          [username]: Date.now(),
        },
      };
      persist();
    },

    userOffline(username) {
      const next = { ...state.liveUsers };
      delete next[username];
      state = { ...state, liveUsers: next };
      persist();
    },

    heartbeat(username) {
      state = {
        ...state,
        liveUsers: {
          ...state.liveUsers,
          [username]: Date.now(),
        },
      };
      persist();
    },

    pushActivity(event) {
      state = {
        ...state,
        activityFeed: [
          ...state.activityFeed,
          { ...event, time: Date.now() },
        ].slice(-200),
      };
      persist();
    },
  };
}

export function currentUserObj(s: OSState) {
  return s.users.find((u) => u.username === s.currentUser) || null;
}
