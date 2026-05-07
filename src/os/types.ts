export type ThemeName = "cloud" | "night" | "forest" | "jason" | "sebastian" | "leo" | "jasoncat";

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  banned?: boolean;
  theme?: ThemeName;
  customWallpaper?: string;
  customFont?: { name: string; dataUrl: string };
  customJumpscare?: string;
  webApps?: WebApp[];
  pinnedApps?: string[];
  screenLocked?: boolean;
  screenLockMessage?: string | null;
}

export interface WebApp {
  id: string;
  name: string;
  url: string;
  icon?: string;
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
  targetId: string;
  imageUrl: string;
  ts: number;
}

export interface PresenceRow {
  userId: string;
  username: string;
  currentApp: string | null;
  route: string | null;
  mouseX: number | null;
  mouseY: number | null;
  viewportW: number | null;
  viewportH: number | null;
  lastSeen: number;
}

export interface ActivityRow {
  id: string;
  userId: string;
  username: string;
  type: string;
  detail: string | null;
  time: number;
}

export interface OSState {
  users: User[];
  currentUser: string | null;
  currentUserId: string | null;
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
  liveUsers: Record<string, PresenceRow>;
  activityFeed: ActivityRow[];
  loading: boolean;
}
