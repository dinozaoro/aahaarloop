import { Tabs } from "expo-router";
import { AppIcon, type IconName } from "@/components";
import { colors, fonts } from "@/theme";

const icons: Record<string, IconName> = { index: "home", matches: "search", create: "add", claims: "clipboard", profile: "person" };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => <AppIcon name={icons[route.name]} size={size} color={typeof color === "string" ? color : colors.ink} />,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.ui, fontSize: 11, fontWeight: "700" },
        tabBarStyle: { height: 76, paddingTop: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="matches" options={{ title: "Discover" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="claims" options={{ title: "Claims" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="conflicts" options={{ title: "Conflicts" }} />
    </Tabs>
  );
}
