# Installation — Aahaarloop Mobile

## QR Code / APK Install

This section explains how to install the mobile app on an Android device.

### Option 1: QR Code (recommended)

1. Install **Expo Go** from the Google Play Store (or scan the QR code directly if you have the Expo app installed).
2. Open this URL on your device's browser: `https://expo.dev/standalone?slug=com.aahaarloop.mobile`
3. Alternatively, use the Expo Go app to scan a QR code generated from the EAS Build.

### Option 2: Manual APK Install

1. Go to the **GitHub Release** page for the latest tag (e.g., `v0.1.0`).
2. Download the `.apk` asset.
3. On your Android device, enable **"Unknown sources"** in Settings → Security.
4. Locate the downloaded `.apk` file using a file manager and tap it to install.
5. Open the app and follow the onboarding flow.

### Option 3: EAS Build (for developers)

```bash
# From the repo root
pnpm build:android

# Or use EAS CLI directly
eas build --platform android --profile preview --non-interactive
```

The built APK will be available in your EAS dashboard or as a GitHub Release artifact.

---

## Development

```bash
# Start the dev server
pnpm dev

# Start the mobile dev server
pnpm --filter @aahaarloop/mobile dev
```