import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  type PermissionStatus,
} from "expo-notifications";
import { Platform } from "react-native";

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("updates", {
      name: "AahaarLoop updates",
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await getPermissionsAsync();
  if (current.granted) {
    return current.status;
  }
  const requested = await requestPermissionsAsync();
  return requested.status;
}
