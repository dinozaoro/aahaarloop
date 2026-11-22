import type { ConfigContext, ExpoConfig } from "expo/config";

declare const process: { env: Record<string, string | undefined> };

const DEFAULT_API_URL = "http://localhost:3000";
// Bump APP_VERSION for user-visible releases and VERSION_CODE for every APK.
const APP_VERSION = "0.1.0";
const VERSION_CODE = 1;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Aahaarloop",
  slug: "aahaarloop",
  version: APP_VERSION,
  orientation: "portrait",
  scheme: "aahaarloop",
  userInterfaceStyle: "automatic",
  icon: "./assets/images/icon.png",
  android: {
    package: "com.aahaarloop.mobile",
    versionCode: VERSION_CODE,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: "com.aahaarloop.mobile",
    icon: "./assets/expo.icon",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  },
});
