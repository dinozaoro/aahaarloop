export function resolveAndroidDownloadUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }

  try {
    return new URL(candidate).protocol === "https:" ? candidate : null;
  } catch {
    return null;
  }
}
