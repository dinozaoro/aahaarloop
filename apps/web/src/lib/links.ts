export const ANDROID_APK_DOWNLOAD_URL =
  "https://github.com/dinozaoro/aahaarloop/releases/latest/download/aahaarloop.apk";

export function resolveAndroidDownloadUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    const path = candidate.split(/[?#]/, 1)[0] ?? "";
    return path.toLowerCase().endsWith(".apk") ? candidate : null;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" &&
      url.pathname.toLowerCase().endsWith(".apk")
      ? candidate
      : null;
  } catch {
    return null;
  }
}
