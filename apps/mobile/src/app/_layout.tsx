import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/context/app-context";
import { OfflineBanner } from "@/components";
import { AuthGate } from "@/auth-gate";

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFF7F0" } }} />
      </AuthGate>
      <OfflineBanner />
    </AppProvider>
  );
}
