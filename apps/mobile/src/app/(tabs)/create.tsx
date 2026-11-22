import { useState } from "react";
import { Image, Text, View } from "react-native";
import { Button, Card, Field, Heading, Pill, Screen, styles } from "@/components";
import { useApp } from "@/context/app-context";
import { apiFetch, ApiError, isOfflineError } from "@/lib/api";
import { queueRequest } from "@/lib/offline";
import { getCurrentPickupPoint } from "@/lib/location";
import { pickFoodImage, uploadFoodImage, type PickedFoodImage } from "@/lib/media";
import { colors } from "@/theme";

const categories = ["prepared", "produce", "bakery", "pantry", "other"];
const units = ["serving", "kg", "piece"];
const storage = ["ambient", "chilled", "frozen"];

export default function CreateDonationScreen() {
  const { refreshOffline, pendingCount } = useApp();
  const [title, setTitle] = useState(""); const [category, setCategory] = useState("prepared"); const [quantity, setQuantity] = useState(""); const [unit, setUnit] = useState("serving"); const [storageType, setStorageType] = useState("ambient"); const [address, setAddress] = useState(""); const [latitude, setLatitude] = useState(""); const [longitude, setLongitude] = useState(""); const [deadline, setDeadline] = useState(""); const [expiry, setExpiry] = useState(""); const [notes, setNotes] = useState(""); const [foodImage, setFoodImage] = useState<PickedFoodImage | null>(null); const [saving, setSaving] = useState(false); const [locating, setLocating] = useState(false); const [message, setMessage] = useState("");
  async function chooseImage(source: "camera" | "library") { try { setMessage(""); const image = await pickFoodImage(source); if (image) setFoodImage(image); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not choose a food photo."); } }
  async function fillCurrentLocation() { setLocating(true); try { const point = await getCurrentPickupPoint(); setLatitude(point.latitude.toFixed(6)); setLongitude(point.longitude.toFixed(6)); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not read your location."); } finally { setLocating(false); } }
  async function submit() {
    const amount = Number(quantity); const lat = Number(latitude); const lon = Number(longitude);
    if (!title.trim() || !Number.isInteger(amount) || amount <= 0 || !address.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || !deadline.trim()) { setMessage("Add a name, whole-number quantity, pickup address, coordinates and an ISO pickup deadline."); return; }
    const baseBody = { title: title.trim(), description: notes.trim() || undefined, items: [{ name: title.trim(), category, quantity: amount, unit, storage: storageType, dietary_flags: [], allergens: [] }], total_servings: amount, available_servings: unit === "serving" ? amount : undefined, pickup_location: { address: address.trim(), point: { latitude: lat, longitude: lon } }, pickup_deadline_at: deadline.trim(), food_expiry_at: expiry.trim() || undefined };
    let body: typeof baseBody & { image_url?: string } = baseBody;
    let imageUrl: string | undefined;
    setSaving(true); setMessage("");
    try {
      if (foodImage) imageUrl = await uploadFoodImage(foodImage);
      body = imageUrl ? { ...baseBody, image_url: imageUrl } : baseBody;
      const created = await apiFetch<{ id: string }>("/api/donations", { method: "POST", body: JSON.stringify(body) });
      try { await apiFetch(`/api/donations/${created.id}/publish`, { method: "POST" }); setMessage("Donation published. Thank you for keeping food in the loop."); }
      catch (publishError) { setMessage(publishError instanceof ApiError ? `Draft saved, but it could not be published: ${publishError.message}` : "Draft saved, but publishing needs another try."); }
      setTitle(""); setQuantity("");
    } catch (error) {
      if (isOfflineError(error)) { try { await queueRequest({ path: "/api/donations", method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); setMessage("Saved as a pending draft. It will sync when you reconnect."); await refreshOffline(); } catch { setMessage("Could not save the draft on this device."); } }
      else setMessage(error instanceof ApiError ? error.message : "Could not create this donation.");
    }
    finally { setSaving(false); }
  }
  return <Screen><View style={createStyles.header}><Text style={createStyles.eyebrow}>DONOR WORKSPACE</Text><Heading size={30}>Share what is left.</Heading><Text style={styles.body}>A fast listing helps a nearby kitchen plan its next meal.</Text>{pendingCount ? <Text style={createStyles.pending}>{pendingCount} saved draft{pendingCount === 1 ? "" : "s"} waiting to sync.</Text> : null}</View><Card style={createStyles.form}><Field label="Food name" value={title} onChangeText={setTitle} placeholder="e.g. Vegetable biryani" /><Text style={createStyles.label}>Food photo</Text>{foodImage ? <Image source={{ uri: foodImage.uri }} style={createStyles.preview} /> : null}<View style={createStyles.row}><View style={createStyles.half}><Button label="Choose photo" kind="secondary" onPress={() => void chooseImage("library")} disabled={saving} /></View><View style={createStyles.half}><Button label="Take photo" kind="secondary" onPress={() => void chooseImage("camera")} disabled={saving} /></View></View><Text style={createStyles.label}>Category</Text><View style={createStyles.pills}>{categories.map((item) => <Pill key={item} active={category === item} onPress={() => setCategory(item)}>{item}</Pill>)}</View><View style={createStyles.row}><View style={createStyles.half}><Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="24" /></View><View style={createStyles.half}><Text style={createStyles.label}>Unit</Text><View style={createStyles.pills}>{units.map((item) => <Pill key={item} active={unit === item} onPress={() => setUnit(item)}>{item}</Pill>)}</View></View></View><Text style={createStyles.label}>Storage</Text><View style={createStyles.pills}>{storage.map((item) => <Pill key={item} active={storageType === item} onPress={() => setStorageType(item)}>{item}</Pill>)}</View><Field label="Pickup address" value={address} onChangeText={setAddress} placeholder="Full address" /><View style={createStyles.row}><View style={createStyles.half}><Field label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="12.9716" /></View><View style={createStyles.half}><Field label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="77.5946" /></View></View><Button label={locating ? "Locating…" : "Use current location"} kind="secondary" onPress={() => void fillCurrentLocation()} disabled={locating || saving} /><Field label="Pickup deadline (ISO 8601)" value={deadline} onChangeText={setDeadline} placeholder="2026-11-21T18:30:00+05:30" autoCapitalize="none" /><Field label="Use-by (optional, ISO 8601)" value={expiry} onChangeText={setExpiry} placeholder="2026-11-22T08:00:00+05:30" autoCapitalize="none" /><Field label="Handling notes and allergens" value={notes} onChangeText={setNotes} multiline placeholder="Keep chilled. Contains milk…" /><Button label={saving ? "Saving…" : "Publish donation"} onPress={() => void submit()} disabled={saving} />{message ? <Text style={[createStyles.message, message.includes("published") ? createStyles.success : null]}>{message}</Text> : null}</Card><Text style={createStyles.disclaimer}>Food safety remains the responsibility of the donor. AahaarLoop does not certify food.</Text></Screen>;
}
const createStyles = { header: { gap: 8 }, eyebrow: { color: colors.success, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, pending: { color: colors.success, fontSize: 12, fontWeight: "800" }, form: { gap: 16 }, label: { color: colors.ink, fontSize: 13, fontWeight: "800" }, pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, row: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, half: { flex: 1 }, preview: { width: "100%", height: 180, borderRadius: 10 }, message: { color: colors.action, fontSize: 13, lineHeight: 19 }, success: { color: colors.success }, disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 16 } } as const;
