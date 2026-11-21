import { StyleSheet, Text, View } from "react-native";

import { calculateUrgency } from "@aahaarloop/matching";
import type { DonationCandidate } from "@aahaarloop/matching";

const HOUR_MS = 60 * 60 * 1000;

// Sample data proves the shared package imports and runs on device. The
// matching engine itself will be wired to the API in a later issue.
const sampleDonation: DonationCandidate = {
  id: "donation-demo",
  location: { latitude: -18.8792, longitude: 47.5079 },
  categories: ["produce"],
  storage: "ambient",
  totalServings: 120,
  availableServings: 80,
  totalWeightKg: 45,
  pickupDeadlineAt: new Date(Date.now() + 5 * HOUR_MS).toISOString(),
};

const urgency = calculateUrgency({
  now: new Date(),
  pickupDeadlineAt: sampleDonation.pickupDeadlineAt,
  travelTimeMinutes: 20,
  handlingTimeMinutes: 10,
  bufferMinutes: 15,
});

const remaining =
  urgency.remainingMinutes === null
    ? "—"
    : `${Math.round(urgency.remainingMinutes)} min`;

export default function MatchesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match preview</Text>
      <Text style={styles.subtitle}>
        Computed by the shared @aahaarloop/matching package.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{urgency.status}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Urgency</Text>
        <Text style={styles.value}>{urgency.level ?? "unknown"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Remaining margin</Text>
        <Text style={styles.value}>{remaining}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Claimable servings</Text>
        <Text style={styles.value}>{sampleDonation.availableServings}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
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
