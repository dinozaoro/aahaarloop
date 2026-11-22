import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Button, Card, DonationCard, EmptyState, Heading, LoadingCards, Screen, SectionTitle, styles } from "@/components";
import { useApp } from "@/context/app-context";
import { apiFetch, type ApiDonation } from "@/lib/api";
import { colors } from "@/theme";
import brandLogo from "../../../assets/images/aahaaroop.png";

export default function HomeScreen() {
  const router = useRouter();
  const { role, isOnline, refreshOffline, cachedDonations, cacheDonations } = useApp();
  const [donations, setDonations] = useState<ApiDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const result = await apiFetch<{ donations: ApiDonation[] }>("/api/donations"); setDonations(result.donations ?? []); void cacheDonations(result.donations ?? []); }
    catch (requestError) { if (cachedDonations.length) setDonations(cachedDonations); else setError(requestError instanceof Error ? requestError.message : "Couldn’t load donations."); }
    finally { setLoading(false); }
  }, [cacheDonations, cachedDonations]);
  useEffect(() => { void load(); }, [load]);
  const roleLabel = role === "recipient" ? "community partner" : role;
  return <Screen>
    <View style={styles.sectionTitle}><View style={homeStyles.titleRow}><Image source={brandLogo} style={homeStyles.logo} resizeMode="contain" accessible accessibilityLabel="AahaarLoop" /><Heading size={26}>Good food deserves{"\n"}another table.</Heading></View><Pressable onPress={() => router.push("/notifications")} accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={8} style={homeStyles.alertsButton}><Text style={homeStyles.alertsText}>Alerts</Text></Pressable></View>
    <Text style={styles.body}>A small loop with a real impact. You’re here as a {roleLabel}.</Text>
    <Card style={homeStyles.hero}><View style={homeStyles.heroCopy}><Text style={homeStyles.heroKicker}>{isOnline ? "THE LOOP IS OPEN" : "WORKING OFFLINE"}</Text><Text style={homeStyles.heroTitle}>{role === "donor" ? "Share what is left." : role === "volunteer" ? "Move good food forward." : "Find food nearby."}</Text><Text style={styles.body}>{role === "donor" ? "Turn today’s surplus into someone’s next meal." : "See useful donations before the pickup window closes."}</Text></View><Button label={role === "donor" ? "Create donation" : role === "volunteer" ? "View pickup tasks" : "Discover food"} onPress={() => router.push(role === "donor" ? "/create" : role === "volunteer" ? "/pickup" : "/matches")} /></Card>
    {error ? <EmptyState title="Couldn’t load donations." body="We couldn’t reach AahaarLoop. Your saved information is safe. Check your connection and try again." primary="Try again" onPrimary={() => { void load(); void refreshOffline(); }} secondary="View saved drafts" onSecondary={() => router.push("/create")} /> : null}
    {!error && loading ? <LoadingCards /> : null}
    {!error && !loading ? <><SectionTitle action={<Pressable onPress={() => router.push("/matches")}><Text style={homeStyles.link}>See all</Text></Pressable>}>{role === "donor" ? "Your active donations" : "Nearby surplus"}</SectionTitle>{donations.length ? donations.slice(0, 2).map((donation) => <DonationCard donation={donation} key={donation.id} />) : <Card><Text style={homeStyles.emptyTitle}>Nothing nearby just yet.</Text><Text style={styles.body}>Try widening your area or changing your pickup window.</Text></Card>}<View style={homeStyles.metrics}><Metric value={String(donations.length)} label="visible donations" /><Metric value={String(donations.reduce((sum, item) => sum + (item.servingsAvailable ?? 0), 0))} label="available portions" /></View></> : null}
  </Screen>;
}
function Metric({ value, label }: { value: string; label: string }) { return <View style={homeStyles.metric}><Text style={homeStyles.metricValue}>{value}</Text><Text style={homeStyles.metricLabel}>{label}</Text></View>; }
const homeStyles = { titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }, logo: { width: 56, height: 56 }, alertsButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 10 }, alertsText: { color: colors.action, fontSize: 12, fontWeight: "800" }, hero: { gap: 18, backgroundColor: colors.warm, padding: 20 }, heroCopy: { gap: 8 }, heroKicker: { color: colors.ink, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 }, heroTitle: { color: colors.ink, fontFamily: "serif", fontSize: 28, lineHeight: 32, fontWeight: "700" }, link: { color: colors.action, fontSize: 13, fontWeight: "800" }, emptyTitle: { color: colors.ink, fontFamily: "serif", fontSize: 24, fontWeight: "700" }, metrics: { flexDirection: "row", gap: 12 }, metric: { flex: 1, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }, metricValue: { color: colors.ink, fontFamily: "serif", fontSize: 28, fontWeight: "700" }, metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 } } as const;
