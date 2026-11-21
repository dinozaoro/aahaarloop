import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/context/app-context";
import { OfflineBanner } from "@/components";

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFF7F0" } }} />
      <OfflineBanner />
    </AppProvider>
  );
}
