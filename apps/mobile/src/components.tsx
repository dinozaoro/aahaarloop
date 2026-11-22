import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/app-context";
import type { ApiDonation } from "@/lib/api";
import { formatDeadline } from "@/lib/api";
import { colors, fonts, radii, spacing } from "@/theme";

export function Screen({ children, scroll = true, ...props }: ViewProps & { scroll?: boolean }) {
  const content = <View {...props} style={[styles.screen, props.style]}>{children}</View>;
  return <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
    {scroll ? <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
  </SafeAreaView>;
}

export function Heading({ children, size = 30 }: { children: React.ReactNode; size?: number }) {
  return <Text style={[styles.heading, { fontSize: size, lineHeight: size + 5 }]}>{children}</Text>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionText}>{children}</Text>{action}</View>;
}

export function Button({ label, onPress, kind = "primary", disabled = false }: { label: string; onPress?: () => void; kind?: "primary" | "secondary" | "text"; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button_${kind}`], pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.buttonText, kind === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{label}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && styles.multiline, props.style]} /></View>;
}

export function Pill({ children, active = false, onPress }: { children: React.ReactNode; active?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityState={onPress ? { selected: active } : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text></Pressable>;
}

export function Card({ children, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, props.style]}>{children}</View>;
}

export function DonationCard({ donation }: { donation: ApiDonation }) {
  const image = donation.photoName;
  return <Link href={{ pathname: "/donations/[id]", params: { id: donation.id } }} asChild>
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.donationCard, pressed && styles.pressed]}>
      {image ? <Image source={{ uri: image }} style={styles.donationImage} /> : <View style={[styles.donationImage, styles.imagePlaceholder]}><Text style={styles.placeholderText}>Photo not available</Text></View>}
      <View style={styles.donationBody}>
        <Text style={styles.donationTitle} numberOfLines={1}>{donation.title}</Text>
        <Text style={styles.donationMeta} numberOfLines={1}>{donation.category ?? "Food surplus"}{donation.pickupArea ? ` · ${donation.pickupArea}` : ""}</Text>
        <Text style={styles.donationQuantity}>{donation.servingsAvailable ?? donation.servingsTotal ?? "—"} portions</Text>
        <Text style={styles.deadline}>{formatDeadline(donation.pickupDeadlineAt)}</Text>
        <View style={styles.reason}><Text style={styles.reasonText}>{donation.status.replaceAll("_", " ")}</Text></View>
      </View>
    </Pressable>
  </Link>;
}

export function LoadingCards() {
  const opacity = useRef(new Animated.Value(0.55)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.7);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.55, duration: 750, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion]);
  return <Animated.View style={{ opacity }}><View style={styles.skeletonCard}><View style={styles.skeletonImage} /><View style={styles.skeletonLineLarge} /><View style={styles.skeletonLine} /><View style={styles.skeletonLineShort} /></View><View style={styles.skeletonCard}><View style={styles.skeletonImage} /><View style={styles.skeletonLineLarge} /><View style={styles.skeletonLine} /><View style={styles.skeletonLineShort} /></View></Animated.View>;
}

export function EmptyState({ title, body, primary, onPrimary, secondary, onSecondary }: { title: string; body: string; primary?: string; onPrimary?: () => void; secondary?: string; onSecondary?: () => void }) {
  return <View style={styles.empty}><Heading size={30}>{title}</Heading><Text style={styles.body}>{body}</Text>{primary ? <Button label={primary} onPress={onPrimary} /> : null}{secondary ? <Button label={secondary} kind="secondary" onPress={onSecondary} /> : null}</View>;
}

export function OfflineBanner() {
  const { isOnline, pendingCount } = useApp();
  if (isOnline && pendingCount === 0) return null;
  return <View style={styles.offline}><Text style={styles.offlineText}>{isOnline ? `${pendingCount} action${pendingCount === 1 ? "" : "s"} waiting to sync` : "Offline · saved actions will sync when connected"}</Text></View>;
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.page },
  screen: { width: "100%", maxWidth: 760, flex: 1, alignSelf: "center", paddingHorizontal: 20, paddingVertical: spacing.xl, gap: spacing.xl, backgroundColor: colors.page },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  heading: { color: colors.ink, fontFamily: fonts.heading, fontWeight: "700" },
  sectionTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionText: { color: colors.ink, fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: { minHeight: 52, borderRadius: radii.md, paddingHorizontal: 22, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  button_primary: { backgroundColor: colors.action },
  button_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button_text: { backgroundColor: "transparent", minHeight: 48 },
  buttonText: { fontSize: 14, fontWeight: "800" },
  buttonTextPrimary: { color: colors.surface },
  buttonTextSecondary: { color: colors.ink },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  card: { gap: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface, shadowColor: colors.ink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 1 },
  field: { gap: spacing.sm },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 52, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  multiline: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  pill: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  pillTextActive: { color: colors.surface },
  donationCard: { overflow: "hidden", borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, backgroundColor: colors.surface },
  donationImage: { width: "100%", height: 170 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.soft },
  placeholderText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  donationBody: { gap: spacing.sm, padding: 18 },
  donationTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  donationMeta: { color: colors.muted, fontSize: 12 },
  donationQuantity: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  deadline: { color: colors.action, fontSize: 12, fontWeight: "800" },
  reason: { padding: spacing.sm, backgroundColor: colors.page },
  reasonText: { color: colors.muted, fontSize: 12 },
  empty: { flex: 1, gap: spacing.lg, justifyContent: "center" },
  offline: { position: "absolute", left: 0, right: 0, bottom: 84, zIndex: 20, padding: 10, backgroundColor: colors.ink },
  offlineText: { color: colors.surface, textAlign: "center", fontSize: 12, fontWeight: "700" },
  skeletonCard: { gap: 14, marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface },
  skeletonImage: { height: 160, borderRadius: radii.sm, backgroundColor: colors.skeleton },
  skeletonLineLarge: { width: "65%", height: 16, borderRadius: radii.sm, backgroundColor: colors.skeleton },
  skeletonLine: { width: "84%", height: 12, borderRadius: radii.sm, backgroundColor: colors.skeleton },
  skeletonLineShort: { width: "54%", height: 12, borderRadius: radii.sm, backgroundColor: colors.skeleton },
});
