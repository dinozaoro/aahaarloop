import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { DonationCard, EmptyState, Heading, LoadingCards, Pill, Screen, styles } from "@/components";
import { apiFetch, type ApiDonation } from "@/lib/api";
import { useApp } from "@/context/app-context";
import { colors } from "@/theme";

const categories = ["all", "prepared", "produce", "bakery", "pantry"];
export default function DiscoverScreen() {
  const { cachedDonations, cacheDonations } = useApp();
  const [donations, setDonations] = useState<ApiDonation[]>([]); const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const result = await apiFetch<{ donations: ApiDonation[] }>("/api/donations"); setDonations(result.donations ?? []); void cacheDonations(result.donations ?? []); } catch (requestError) { if (cachedDonations.length) setDonations(cachedDonations); else setError(requestError instanceof Error ? requestError.message : "Couldn’t load donations."); } finally { setLoading(false); } }, [cacheDonations, cachedDonations]);
  // Data loading is intentionally kicked off after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => donations.filter((donation) => { const matchesQuery = !query.trim() || `${donation.title} ${donation.description ?? ""} ${donation.pickupArea ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()); return matchesQuery && (category === "all" || donation.category === category); }), [category, donations, query]);
  return <Screen><View style={discoverStyles.header}><Heading size={25}>Discover</Heading><Text style={styles.body}>Find food nearby before the pickup window closes.</Text></View><TextInput value={query} onChangeText={setQuery} placeholder="Search food or area" placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel="Search donations" /><View style={discoverStyles.pills}>{categories.map((item) => <Pill key={item} active={category === item} onPress={() => setCategory(item)}>{item[0].toUpperCase() + item.slice(1)}</Pill>)}</View>{loading ? <LoadingCards /> : error ? <EmptyState title="Couldn’t load donations." body="We couldn’t reach AahaarLoop. Your saved information is safe. Check your connection and try again." primary="Try again" onPrimary={() => void load()} secondary="View saved drafts" /> : filtered.length ? filtered.map((donation) => <DonationCard donation={donation} key={donation.id} />) : <EmptyState title="Nothing nearby just yet." body="Try widening your area or changing your pickup window. We’ll keep your food preferences." primary="Adjust filters" onPrimary={() => { setCategory("all"); setQuery(""); }} />}{!loading && !error ? <Pressable onPress={() => void load()}><Text style={discoverStyles.refresh}>Refresh availability</Text></Pressable> : null}</Screen>;
}
const discoverStyles = { header: { gap: 8 }, pills: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, refresh: { color: colors.action, textAlign: "center", fontSize: 13, fontWeight: "800", paddingVertical: 10 } } as const;
