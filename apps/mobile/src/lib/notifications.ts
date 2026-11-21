import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function requestNotificationPermission(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("updates", { name: "AahaarLoop updates", importance: Notifications.AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return current.status;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status;
}
