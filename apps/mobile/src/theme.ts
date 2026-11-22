import { Platform } from "react-native";

export const colors = {
  page: "#FFF7F0",
  surface: "#FFFFFF",
  ink: "#2C1618",
  muted: "#70605D",
  border: "#E8D4CD",
  action: "#DF211B",
  accent: "#E12620",
  warm: "#FFC928",
  success: "#A65A00",
  soft: "#F8E3D6",
  skeleton: "#EDDBD3",
  pink: "#B51757",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 20 } as const;

export const fonts = {
  ui: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
  heading: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
} as const;
