import cloud from "@/assets/wp-cloud.jpg";
import night from "@/assets/wp-night.jpg";
import forest from "@/assets/wp-forest.jpg";
import jason from "@/assets/jason.png";
import sebastian from "@/assets/sebastian.png";
import leo from "@/assets/leo.png";
import type { ThemeName } from "./types";

export const wallpapers: Record<ThemeName, string> = {
  cloud,
  night,
  forest,
  jason,
  sebastian,
  leo,
};

export const themeLabels: Record<ThemeName, string> = {
  cloud: "Cloud",
  night: "Night",
  forest: "Forest",
  jason: "Jason",
  sebastian: "Sebastian",
  leo: "Leo",
};

export const jasonImg = jason;
export const sebastianImg = sebastian;
export const leoImg = leo;

export function themeIconOverride(theme: ThemeName): string | null {
  if (theme === "jason") return jason;
  if (theme === "sebastian") return sebastian;
  if (theme === "leo") return leo;
  return null;
}