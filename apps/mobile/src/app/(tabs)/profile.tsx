import { useState } from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { Button, Card, Field, Heading, Pill, Screen, styles } from "@/components";
import { useApp } from "@/context/app-context";
import { requestNotificationPermission } from "@/lib/notifications";
import { colors } from "@/theme";

const roles = ["donor", "recipient", "volunteer"] as const;
export default function ProfileScreen() {
  const {
    role,
    setRole,
    activeOrganizationId,
    setActiveOrganizationId,
    cachedUser,
    registerPushToken,
    signOut,
  } = useApp();
  const [permission, setPermission] = useState("");
  const [pushTokenStatus, setPushTokenStatus] = useState<"idle" | "registering" | "success" | "error">("idle");

  async function enableNotifications() {
    try {
      setPermission(await requestNotificationPermission());
    } catch (error) {
      setPermission(error instanceof Error ? error.message : "Notification permission failed.");
    }
  }

  async function registerPushTokenHandler() {
    if (!cachedUser?.id) {
      setPushTokenStatus("error");
      return;
    }
    setPushTokenStatus("registering");
    try {
      const result = await registerPushToken(cachedUser.id);
      if (result.success) {
        setPushTokenStatus("success");
      } else {
        setPushTokenStatus("error");
      }
    } catch (err) {
      setPushTokenStatus("error");
    }
  }

  return (
    <Screen>
      <View style={profileStyles.header}>
        <Text style={profileStyles.eyebrow}>PROFILE</Text>
        <Heading size={30}>Your place in the loop.</Heading>
      </View>

      {cachedUser ? (
        <View style={profileStyles.card}>
          <Text style={profileStyles.label}>Welcome, {cachedUser.id.substring(0, 8)}...</Text>
          <Text style={profileStyles.label}>Role: {role}</Text>
          <Text style={profileStyles.label}>Organization ID: {activeOrganizationId || "—"}</Text>
        </View>
      ) : (
        <Text style={styles.body}>Loading profile...</Text>
      )}

      <Card style={profileStyles.card}>
        <Text style={profileStyles.title}>Notifications</Text>
        <Text style={styles.body}>Allow pickup reminders and claim updates from this device.</Text>
        <Button label="Enable notifications" kind="secondary" onPress={() => void enableNotifications()} />
        {permission ? (
          <Text style={profileStyles.permission}>{permission}</Text>
        ) : null}
        {cachedUser ? (
          <View>
            <Button
              label={pushTokenStatus === "idle" ? "Register push token" : pushTokenStatus === "registering" ? "Registering..." : "Registered"}
              kind={pushTokenStatus === "idle" ? "primary" : "secondary"}
              onPress={() => void registerPushTokenHandler()}
            />
            {pushTokenStatus === "success" && <Text style={{ color: colors.success }}>Push token registered successfully</Text>}
            {pushTokenStatus === "error" && <Text style={{ color: colors.accent }}>Failed to register push token</Text>}
          </View>
        ) : null}
      </Card>

      <Card style={profileStyles.card}>
        <Text style={profileStyles.title}>Sign-in connection</Text>
        <Text style={styles.body}>
          {" "}
          {cachedUser ? (
            `Signed in as ${cachedUser.id.substring(0, 8)}... • Role: ${role}`
          ) : (
            "Checking your session..."
          )}
        </Text>
        <Button label="Sign out" kind="secondary" onPress={() => void signOut()} />
      </Card>

      <View style={profileStyles.links}>
        <Link href="/impact" asChild>
          <Text style={profileStyles.link}>View impact →</Text>
        </Link>
        {role === "volunteer" ? (
          <Link href="/pickup" asChild>
            <Text style={profileStyles.link}>View pickup tasks →</Text>
          </Link>
        ) : null}
        <Link href="/notifications" asChild>
          <Text style={profileStyles.link}>View notifications →</Text>
        </Link>
      </View>
    </Screen>
  );
}
const profileStyles = {
  header: { gap: 8 },
  eyebrow: { color: colors.action, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  card: { gap: 16 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  pills: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  title: { color: colors.ink, fontSize: 17, fontWeight: "800", marginBottom: 4 },
  permission: { color: colors.success, fontSize: 12 },
  links: { gap: 14 },
  link: { color: colors.action, fontSize: 14, fontWeight: "800" },
} as const;