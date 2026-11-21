import Constants from "expo-constants";

const FALLBACK_API_URL = "http://localhost:3000";

/**
 * Public runtime configuration, resolved from `app.config.ts`.
 *
 * Only `EXPO_PUBLIC_*` values may reach the app; secrets belong on the server.
 */
export const env = {
  apiUrl: String(Constants.expoConfig?.extra?.apiUrl ?? FALLBACK_API_URL),
} as const;
