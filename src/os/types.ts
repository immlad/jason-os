export type ThemeName = "cloud" | "night" | "forest" | "jason" | "sebastian" | "leo";

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
  banned?: boolean;
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
  globalMessages: GlobalMessage[];
  trollEvents: TrollEvent[];
  dockSide: "bottom" | "left" | "right" | "top";
  dockShape: "pill" | "rounded" | "square";
  dockOrder: string[];
  desktopIcons: Record<string, { x: number; y: number }>;
}