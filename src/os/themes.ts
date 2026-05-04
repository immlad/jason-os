import cloud from "@/assets/wp-cloud.jpg";
import night from "@/assets/wp-night.jpg";
import forest from "@/assets/wp-forest.jpg";
import jason from "@/assets/jason.png";
import sebastian from "@/assets/sebastian.png";
import type { ThemeName } from "./types";

export const wallpapers: Record<ThemeName, string> = {
  cloud,
  night,
  forest,
  jason,
  sebastian,
};

export const themeLabels: Record<ThemeName, string> = {
  cloud: "Cloud",
  night: "Night",
  forest: "Forest",
  jason: "Jason",
  sebastian: "Sebastian",
};

export const jasonImg = jason;
export const sebastianImg = sebastian;

export function themeIconOverride(theme: ThemeName): string | null {
  if (theme === "jason") return jason;
  if (theme === "sebastian") return sebastian;
  return null;
}