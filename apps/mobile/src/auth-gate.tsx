import { useEffect } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";

import { Button, Heading, styles as appStyles } from "@/components";
import { env } from "@/config/env";
import { useApp } from "@/context/app-context";
import { colors, spacing } from "@/theme";

function openWebSignIn(mode: "signin" | "register") {
  const handoff = `${env.apiUrl}/api/mobile/handoff?returnTo=aahaarloop%3A%2F%2Fauth&mode=${mode}`;
  void Linking.openURL(handoff);
}

function SignInScreen() {
  return <View style={appStyles.screen}>
    <Heading size={34}>Your place in the loop.</Heading>
    <Text style={appStyles.body}>Sign in with Google to see your role and organization, discover surplus food and coordinate pickups.</Text>
    <View style={localStyles.actions}>
      <Button label="Sign in with Google" onPress={() => openWebSignIn("signin")} />
      <Button label="Create an account" kind="secondary" onPress={() => openWebSignIn("register")} />
    </View>
    <Text style={appStyles.body}>You will return here automatically once setup is complete.</Text>
  </View>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authReady, hasSession, completeSignIn } = useApp();

  useEffect(() => {
    const receive = ({ url }: { url: string }) => {
      const cookie = new URL(url).searchParams.get("session");
      if (cookie) void completeSignIn(cookie);
    };
    void Linking.getInitialURL().then((url) => { if (url) receive({ url }); });
    const subscription = Linking.addEventListener("url", receive);
    return () => subscription.remove();
  }, [completeSignIn]);

  if (!authReady) return <View style={localStyles.loading}><ActivityIndicator color={colors.action} /></View>;
  if (!hasSession) return <SignInScreen />;
  return children;
}

const localStyles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page },
  actions: { gap: spacing.md },
});
