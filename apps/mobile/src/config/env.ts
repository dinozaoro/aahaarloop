import Constants from "expo-constants";

// Android emulators expose the host machine through 10.0.2.2. Physical devices
// should set EXPO_PUBLIC_API_URL to the machine's LAN address.
const FALLBACK_API_URL = "http://10.0.2.2:3000";

/**
 * Public runtime configuration, resolved from `app.config.ts`.
 *
 * Only `EXPO_PUBLIC_*` values may reach the app; secrets belong on the server.
 */
export const env = {
  apiUrl: String(Constants.expoConfig?.extra?.apiUrl ?? FALLBACK_API_URL),
} as const;
