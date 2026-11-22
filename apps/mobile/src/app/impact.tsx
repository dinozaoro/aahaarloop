import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Card, EmptyState, Heading, LoadingCards, Screen, styles } from "@/components";
import { apiFetch, type ApiDonation } from "@/lib/api";
import { colors } from "@/theme";

export default function ImpactScreen() {
  const [donations, setDonations] = useState<ApiDonation[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const load = useCallback(async () => { try { const result = await apiFetch<{ donations: ApiDonation[] }>("/api/donations"); setDonations(result.donations ?? []); } catch { setError(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const portions = donations.reduce((sum, item) => sum + (item.servingsTotal ?? 0), 0);
  return <Screen><View style={impactStyles.header}><Text style={impactStyles.eyebrow}>THE DIFFERENCE</Text><Heading size={30}>Small actions, shared impact.</Heading><Text style={styles.body}>Metrics below use the donations visible to your authenticated account.</Text></View>{loading ? <LoadingCards /> : error ? <EmptyState title="Impact is waiting." body="We could not load the verified donation data." primary="Try again" onPrimary={() => { setLoading(true); setError(false); void load(); }} /> : <><View style={impactStyles.grid}><Metric value={String(donations.length)} label="donations listed" /><Metric value={String(portions)} label="portions listed" /></View><Card><Text style={impactStyles.title}>Estimated meals</Text><Text style={styles.body}>Estimated meals are based on listed portions, not a food-safety or delivery verification.</Text><Text style={impactStyles.big}>{portions}</Text></Card></>}</Screen>;
}
function Metric({ value, label }: { value: string; label: string }) { return <View style={impactStyles.metric}><Text style={impactStyles.big}>{value}</Text><Text style={impactStyles.label}>{label}</Text></View>; }
const impactStyles = { header: { gap: 8 }, eyebrow: { color: colors.success, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, grid: { flexDirection: "row", gap: 12 }, metric: { flex: 1, padding: 18, backgroundColor: colors.warm, borderRadius: 10 }, big: { color: colors.ink, fontFamily: "serif", fontSize: 34, fontWeight: "700", marginTop: 8 }, label: { color: colors.ink, fontSize: 12, fontWeight: "700" }, title: { color: colors.ink, fontSize: 17, fontWeight: "800" } } as const;
