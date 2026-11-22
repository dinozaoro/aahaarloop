import { styles as appStyles, Button, Heading } from "@/components";
import { env } from "@/config/env";
import { useApp } from "@/context/app-context";
import { colors, spacing } from "@/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SignInScreen({
  error,
  setError,
}: {
  error: string | null;
  setError: (message: string | null) => void;
}) {
  const [opening, setOpening] = useState<"signin" | "register" | null>(null);

  async function openWebSignIn(mode: "signin" | "register") {
    const handoff = `${env.apiUrl}/api/mobile/handoff?returnTo=aahaarloop%3A%2F%2Fauth&mode=${mode}`;
    setError(null);
    setOpening(mode);
    try {
      await Linking.openURL(handoff);
    } catch {
      setError(
        "Could not open your browser. Check your connection and try again.",
      );
    } finally {
      setOpening(null);
    }
  }

  return (
    <SafeAreaView style={localStyles.safeArea}>
      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View style={appStyles.screen}>
          <Text style={localStyles.brand}>AAHAARLOOP · BENGALURU</Text>
          <Heading size={34}>Good food moves better together.</Heading>
          <Text style={appStyles.body}>
            Sign in with Google to find nearby food, share surplus or coordinate
            a pickup.
          </Text>
          <View style={localStyles.actions}>
            <Button
              label={
                opening === "signin"
                  ? "Opening Google sign-in..."
                  : "Sign in with Google"
              }
              disabled={opening !== null}
              onPress={() => void openWebSignIn("signin")}
            />
            <Button
              label={
                opening === "register"
                  ? "Opening account setup..."
                  : "Create an account"
              }
              kind="secondary"
              disabled={opening !== null}
              onPress={() => void openWebSignIn("register")}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={localStyles.error}>
              {error}
            </Text>
          ) : null}
          <Text style={appStyles.body}>
            New here? Choose a role and set up your organization in the browser.
            We’ll bring you back to this app when you’re done.
          </Text>
          <Text style={localStyles.privacy}>
            Your Google password is never shared with AahaarLoop.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authReady, hasSession, completeSignIn } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const receive = ({ url }: { url: string }) => {
      let callback: URL;
      try {
        callback = new URL(url);
      } catch {
        return;
      }
      if (callback.protocol !== "aahaarloop:" || callback.hostname !== "auth")
        return;
      const cookie = callback.searchParams.get("session");
      if (!cookie) return;
      void completeSignIn(cookie)
        .then(() => setError(null))
        .catch(() => {
          setError(
            "Could not save your sign-in on this device. Please try again.",
          );
        });
    };
    void Linking.getInitialURL()
      .then((url) => {
        if (url) receive({ url });
      })
      .catch(() => {
        setError("Could not resume your sign-in. Please try again.");
      });
    const subscription = Linking.addEventListener("url", receive);
    return () => subscription.remove();
  }, [completeSignIn]);

  if (!authReady)
    return (
      <View style={localStyles.loading}>
        <ActivityIndicator
          accessibilityLabel="Loading your session"
          color={colors.action}
        />
      </View>
    );
  if (!hasSession) return <SignInScreen error={error} setError={setError} />;
  return children;
}

const localStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.page },
  scrollContent: { flexGrow: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
  },
  actions: { gap: spacing.md },
  brand: {
    color: colors.action,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  error: { color: colors.accent, fontSize: 14, lineHeight: 20 },
  privacy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
