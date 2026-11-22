import { colors, fonts } from "@/theme";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.ui,
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarStyle: {
          height: 56 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Find food",
          tabBarAccessibilityLabel: "Find available food",
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Offer food",
          tabBarAccessibilityLabel: "Offer surplus food",
        }}
      />
      <Tabs.Screen name="claims" options={{ title: "My claims" }} />
      <Tabs.Screen name="profile" options={{ title: "Account" }} />
    </Tabs>
  );
}
