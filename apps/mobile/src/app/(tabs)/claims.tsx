import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { Card, EmptyState, Heading, Screen, styles } from "@/components";
import { useApp } from "@/context/app-context";
import { colors } from "@/theme";

export default function ClaimsScreen() {
  const router = useRouter();
  const { claims, refreshClaims } = useApp();
  useFocusEffect(useCallback(() => { void refreshClaims(); }, [refreshClaims]));
  return <Screen><View style={claimsStyles.header}><Text style={claimsStyles.eyebrow}>YOUR LOOP</Text><Heading size={30}>Claims and pickups.</Heading><Text style={styles.body}>Track what is moving from surplus to a shared table.</Text></View>{claims.length ? claims.map((claim) => <Link key={claim.id} href={{ pathname: "/donations/[id]", params: { id: claim.donationId } }} asChild><Card><Text style={claimsStyles.title}>Donation claim</Text><Text style={styles.body}>{claim.servings} portions · {claim.status.replaceAll("_", " ")}</Text><Text style={claimsStyles.link}>Open tracking</Text></Card></Link>) : <EmptyState title="No claims yet." body="When you claim a donation, its pickup status will appear here. Claims are synced from the shared API when you open this screen." primary="Discover food" onPrimary={() => router.push("/matches")} />}</Screen>;
}
const claimsStyles = { header: { gap: 8 }, eyebrow: { color: colors.action, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 17, fontWeight: "800" }, link: { color: colors.action, fontSize: 13, fontWeight: "800" } } as const;
