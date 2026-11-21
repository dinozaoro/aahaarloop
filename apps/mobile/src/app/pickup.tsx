import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, EmptyState, Heading, LoadingCards, Screen, styles } from "@/components";
import { apiFetch } from "@/lib/api";
import { colors } from "@/theme";

interface PickupTask { id: string; claimId: string; donationId: string; status: string; address: string; windowStart?: string; windowEnd?: string; }
const steps = ["unassigned", "assigned", "in_progress", "completed"];

export default function PickupScreen() {
  const [tasks, setTasks] = useState<PickupTask[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await apiFetch<{ tasks: PickupTask[] }>("/api/pickups/tasks"); setTasks(result.tasks ?? []); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load pickup tasks."); } finally { setLoading(false); } }, []);
  // Data loading is intentionally kicked off after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <Screen><View style={pickupStyles.header}><Text style={pickupStyles.eyebrow}>PICKUP DESK</Text><Heading size={30}>Move it forward.</Heading><Text style={styles.body}>Only server-provided assignments are shown. Statuses follow the backend workflow.</Text></View>{loading ? <LoadingCards /> : error ? <EmptyState title="Couldn’t load pickup tasks." body={error} primary="Try again" onPrimary={() => void load()} /> : tasks.length ? tasks.map((task) => <Card key={task.id}><Text style={pickupStyles.title}>Pickup {task.id.slice(0, 8)}</Text><Text style={styles.body}>{task.address}</Text><Text style={pickupStyles.window}>{task.windowStart ? `${new Date(task.windowStart).toLocaleString()}${task.windowEnd ? ` – ${new Date(task.windowEnd).toLocaleTimeString()}` : ""}` : "Window not provided"}</Text><View style={pickupStyles.timeline}>{steps.map((step, index) => <View style={pickupStyles.step} key={step}><View style={[pickupStyles.dot, steps.indexOf(task.status) >= index && pickupStyles.dotActive]} /><Text style={[pickupStyles.stepLabel, steps.indexOf(task.status) >= index && pickupStyles.stepActive]}>{step.replace("_", " ")}</Text></View>)}</View></Card>) : <EmptyState title="No pickup tasks yet." body="Assignments appear here when the backend creates them for your volunteer account." />}{!loading && !error ? <Pressable onPress={() => void load()}><Text style={pickupStyles.refresh}>Refresh assignments</Text></Pressable> : null}</Screen>;
}
const pickupStyles = { header: { gap: 8 }, eyebrow: { color: colors.success, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 17, fontWeight: "800" }, window: { color: colors.action, fontSize: 12, fontWeight: "800", marginTop: 4 }, timeline: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 }, step: { alignItems: "center", flex: 1, gap: 6 }, dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border }, dotActive: { backgroundColor: colors.success }, stepLabel: { color: colors.muted, fontSize: 10, textAlign: "center" }, stepActive: { color: colors.ink, fontWeight: "800" }, refresh: { color: colors.action, textAlign: "center", fontSize: 13, fontWeight: "800" } } as const;
