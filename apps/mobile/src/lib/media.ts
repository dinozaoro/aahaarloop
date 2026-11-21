import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "./api";

export interface PickedFoodImage {
  uri: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
}

function normalizeAsset(asset: ImagePicker.ImagePickerAsset): PickedFoodImage | null {
  const mimeType = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : asset.mimeType === "image/jpeg" ? asset.mimeType : null;
  if (!mimeType) return null;
  return { uri: asset.uri, fileName: asset.fileName ?? `food-${Date.now()}.jpg`, mimeType, sizeBytes: asset.fileSize ?? 1 };
}

export async function pickFoodImage(source: "camera" | "library"): Promise<PickedFoodImage | null> {
  const permission = source === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(source === "camera" ? "Camera permission is required to take a food photo." : "Photo library permission is required to choose a food photo.");
  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [4, 3] })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [4, 3] });
  if (result.canceled || !result.assets[0]) return null;
  const asset = normalizeAsset(result.assets[0]);
  if (!asset) throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (asset.sizeBytes > 8 * 1024 * 1024) throw new Error("Food photos must be smaller than 8 MB.");
  return asset;
}

export async function uploadFoodImage(image: PickedFoodImage, donationId?: string): Promise<string> {
  const signed = await apiFetch<{ url: string; publicId: string; apiKey: string; timestamp: number; folder: string; signature: string }>("/api/uploads/sign", {
    method: "POST",
    body: JSON.stringify({ fileName: image.fileName, mimeType: image.mimeType, sizeBytes: image.sizeBytes, ...(donationId ? { donationId } : {}) }),
  });
  const form = new FormData();
  form.append("file", { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("folder", signed.folder);
  form.append("public_id", signed.publicId);
  form.append("signature", signed.signature);
  const response = await fetch(signed.url, { method: "POST", body: form });
  if (!response.ok) throw new Error("The food photo could not be uploaded.");
  const result = await response.json() as { secure_url?: string };
  if (!result.secure_url) throw new Error("The image service returned no image URL.");
  return result.secure_url;
}
