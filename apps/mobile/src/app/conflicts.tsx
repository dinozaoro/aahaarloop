import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button, Card, EmptyState, Heading, Screen, styles } from "@/components";
import { listSyncConflicts, resolveSyncConflict } from "@/lib/offline";
import type { LocalConflict } from "@/data";
import { colors } from "@/theme";

export default function ConflictsScreen() {
  const [conflicts, setConflicts] = useState<LocalConflict[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setConflicts(await listSyncConflicts());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function resolve(id: string, resolution: "merged" | "overwritten" | "cancelled") {
    await resolveSyncConflict(id, resolution);
    await load();
  }

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Heading size={25}>Sync conflicts</Heading>
        <Text style={styles.body}>Choose what to keep when a local change and the server disagree.</Text>
      </View>
      {loading ? <Text style={styles.body}>Loading…</Text> : conflicts.length === 0 ? (
        <EmptyState title="All clear" body="No conflicts need your review." />
      ) : (
        conflicts.map((conflict) => (
          <Card key={conflict.id}>
            <Text style={{ fontWeight: "800", color: colors.ink }}>
              {conflict.entityType} · {conflict.resolution}
            </Text>
            <Text style={styles.body}>{conflict.entityId ?? "new record"}</Text>
            {conflict.resolution === "pending" ? (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button label="Merge" kind="secondary" onPress={() => void resolve(conflict.id, "merged")} />
                <Button label="Keep local" kind="secondary" onPress={() => void resolve(conflict.id, "overwritten")} />
                <Button label="Discard" kind="secondary" onPress={() => void resolve(conflict.id, "cancelled")} />
              </View>
            ) : (
              <Text style={styles.body}>Resolved</Text>
            )}
          </Card>
        ))
      )}
      <Pressable onPress={() => void load()}>
        <Text style={{ color: colors.action, textAlign: "center" }}>Refresh</Text>
      </Pressable>
    </Screen>
  );
}
