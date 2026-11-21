import { StyleSheet, Text, View } from "react-native";

import { env } from "@/config/env";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aahaarloop</Text>
      <Text style={styles.subtitle}>
        Surplus food, matched with the people who need it.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>API base URL</Text>
        <Text style={styles.value}>{env.apiUrl}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
  card: {
    gap: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748B",
  },
  value: {
    fontSize: 16,
    color: "#0F172A",
  },
});
