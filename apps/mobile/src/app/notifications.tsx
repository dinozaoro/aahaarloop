import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, EmptyState, Heading, LoadingCards, Screen, styles } from "@/components";
import { apiFetch } from "@/lib/api";
import { colors } from "@/theme";

interface Notification { id: string; title?: string; message?: string; read?: boolean; createdAt?: string; }
export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { try { const result = await apiFetch<{ data?: Notification[]; notifications?: Notification[] }>("/api/notifications"); setItems(result.notifications ?? result.data ?? []); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load notifications."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function markRead(item: Notification) { if (item.read) return; try { await apiFetch(`/api/notifications/${item.id}/read`, { method: "POST" }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); } catch { /* Keep the unread marker until the server confirms. */ } }
  return <Screen><View style={notificationStyles.header}><Text style={notificationStyles.eyebrow}>UPDATES</Text><Heading size={30}>Keep the loop moving.</Heading><Text style={styles.body}>Claims, pickup reminders and delivery status from AahaarLoop.</Text></View>{loading ? <LoadingCards /> : error ? <EmptyState title="Couldn’t load notifications." body="Notifications require an authenticated backend session." primary="Try again" onPrimary={() => { setLoading(true); void load(); }} /> : items.length ? items.map((item) => <Pressable key={item.id} onPress={() => void markRead(item)}><Card style={item.read ? undefined : notificationStyles.unread}><Text style={notificationStyles.title}>{item.title ?? "AahaarLoop update"}</Text><Text style={styles.body}>{item.message ?? "You have a new update."}</Text></Card></Pressable>) : <EmptyState title="You’re all caught up." body="New claim and pickup updates will appear here when the backend sends them." />}{!loading && !error ? <Pressable onPress={() => void load()}><Text style={notificationStyles.refresh}>Refresh</Text></Pressable> : null}</Screen>;
}
const notificationStyles = { header: { gap: 8 }, eyebrow: { color: colors.action, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 16, fontWeight: "800" }, unread: { borderLeftWidth: 3, borderLeftColor: colors.action }, refresh: { color: colors.action, textAlign: "center", fontSize: 13, fontWeight: "800" } } as const;
