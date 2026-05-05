import { useEffect, useState } from "react";
import type { OSState, ThemeName, User, GlobalMessage, TrollEvent } from "./types";

const KEY = "jason-os-state-v2";

const defaultState: OSState = {
  users: [],
  currentUser: null,
  theme: "cloud",
  sebastianUnlocked: false,
  leoUnlocked: false,
  globalMessages: [],
  trollEvents: [],
  dockSide: "bottom",
  dockShape: "pill",
  dockOrder: [],
  desktopIcons: {},
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
}

export function useOS() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    state,
    signup(username: string, password: string): { ok: boolean; error?: string } {
      const u = username.trim();
      if (!u || !password) return { ok: false, error: "Username and password required" };
      if (state.users.find((x) => x.username.toLowerCase() === u.toLowerCase()))
        return { ok: false, error: "Username already taken" };
      const isAdmin = ["jason", "minh"].includes(u.toLowerCase());
      const user: User = { username: u, password, isAdmin };
      state = { ...state, users: [...state.users, user], currentUser: u };
      persist();
      return { ok: true };
    },
    login(username: string, password: string): { ok: boolean; error?: string } {
      const user = state.users.find(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (!user) return { ok: false, error: "User not found" };
      if (user.banned) return { ok: false, error: "You have been banned" };
      if (user.password !== password) return { ok: false, error: "Wrong password" };
      state = { ...state, currentUser: user.username };
      persist();
      return { ok: true };
    },
    logout() {
      state = { ...state, currentUser: null };
      persist();
    },
    setTheme(theme: ThemeName) {
      state = { ...state, theme };
      persist();
    },
    setDockSide(dockSide: OSState["dockSide"]) {
      state = { ...state, dockSide };
      persist();
    },
    setDockShape(dockShape: OSState["dockShape"]) {
      state = { ...state, dockShape };
      persist();
    },
    setDockOrder(dockOrder: string[]) {
      state = { ...state, dockOrder };
      persist();
    },
    setDesktopIcon(id: string, pos: { x: number; y: number }) {
      state = { ...state, desktopIcons: { ...state.desktopIcons, [id]: pos } };
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
    sendGlobal(text: string) {
      if (!state.currentUser) return;
      const m: GlobalMessage = {
        id: crypto.randomUUID(),
        from: state.currentUser,
        text,
        ts: Date.now(),
      };
      state = { ...state, globalMessages: [...state.globalMessages, m].slice(-100) };
      persist();
    },
    ban(username: string) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === username ? { ...u, banned: true } : u
        ),
      };
      persist();
    },
    makeAdmin(username: string) {
      state = {
        ...state,
        users: state.users.map((u) =>
          u.username === username ? { ...u, isAdmin: true } : u
        ),
      };
      persist();
    },
    troll(target: string, imageUrl: string) {
      const t: TrollEvent = {
        id: crypto.randomUUID(),
        target,
        imageUrl,
        ts: Date.now(),
      };
      state = { ...state, trollEvents: [...state.trollEvents, t].slice(-20) };
      persist();
    },
    dismissTroll(id: string) {
      state = { ...state, trollEvents: state.trollEvents.filter((t) => t.id !== id) };
      persist();
    },
  };
}

export function currentUserObj(s: OSState) {
  return s.users.find((u) => u.username === s.currentUser) || null;
}