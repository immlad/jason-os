export type ThemeName = "cloud" | "night" | "forest" | "jason" | "sebastian" | "leo" | "jasoncat";

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
  banned?: boolean;
  theme?: ThemeName;
  customWallpaper?: string; // data URL
  customFont?: { name: string; dataUrl: string };
  webApps?: WebApp[];
  pinnedApps?: string[]; // app ids pinned to the dock
}

export interface WebApp {
  id: string;
  name: string;
  url: string;
  icon?: string; // data URL
  color?: string;
}

export interface GlobalMessage {
  id: string;
  from: string;
  text: string;
  ts: number;
}

export interface TrollEvent {
  id: string;
  target: string;
  imageUrl: string;
  ts: number;
}

export interface OSState {
  users: User[];
  currentUser: string | null;
  theme: ThemeName;
  sebastianUnlocked: boolean;
  leoUnlocked: boolean;
  jasonCatUnlocked: boolean;
  globalMessages: GlobalMessage[];
  trollEvents: TrollEvent[];
  dockSide: "bottom" | "left" | "right" | "top";
  dockShape: "pill" | "rounded" | "square";
  dockOrder: string[];
  desktopIcons: Record<string, { x: number; y: number }>;
}