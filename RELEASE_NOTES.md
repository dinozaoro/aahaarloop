# Release Notes — Aahaarloop v0.1.0

## 🎯 New Features

### Neobrutalist Redesign (Web + Mobile)
- Full visual overhaul with paper `#FFFDF5`, ink `#111111`, saturated accents (yellow `#FFD43B`, pink `#FF6B9A`, cyan `#4DD4F7`, lime `#C6F35A`, orange `#FF8A3D`, violet `#A78BFA`)
- Hard offset shadows only (no blur/gradients/glass), 3px borders everywhere
- Archivo Black display + Space Grotesk UI/body typography
- Animations: 90–160ms, ease-out, translation press feedback, no bounce

### Issue #60 — Mobile Native Authentication
- **Endpoint `GET /api/mobile-token`** returns user identity (id, role, activeOrganizationId) for native API calls
- Mobile `apiFetch()` now supports optional `authToken` bearer header
- App context fetches token on launch via `getMobileAuthToken()`, stores `cachedUser`
- Profile screen now shows welcome message, role, org ID — no more "until available" notice

### Issue #65 — Push Token Registration
- **Endpoint `POST /api/push-token`** registers an Expo push token per user
- Mobile API client has `registerPushToken(token, platform)` function
- Context exposes `registerPushToken`; profile screen has a button showing registration status
- On first press: "Registering..." → "Registered" / "Failed to register push token"

---

## 📱 What's Changed

| Category | Details |
|----------|---------|
| **Web** | Neobrutalist skin on all core screens (landing, onboarding, profile, impact, claims, etc.)<br>Build: `next build` ✅<br>Typecheck: `tsc --noEmit` ✅ |
| **Mobile** | Native auth token flow, push token registration UI<br>15/15 mobile tests pass<br>Typecheck clean against project TS config |
| **API** | Two new endpoints added<br>`GET /api/mobile-token` — identity for native calls<br>`POST /api/push-token` — register Expo push tokens |
| **CI** | PR #179 merged → main ✅<br>All checks passing |

---

## 📦 What's Included in This Release

| File | Description |
|------|-------------|
| `aahaarloop-v0.1.0.apk` | Android Preview APK (built with EAS) |
| `aahaarloop-v0.1.0.apk.sha256` | SHA256 checksum for verification |
| `INSTALL.md` | This file — installation instructions |
| `RELEASE_NOTES.md` | These release notes |

---

## 🐛 Known Issues / Limitations

- **AI Gateway** runs in degraded no-cost mode (`enabled:false`); `/api/ai/models` returns `available:false` gracefully
- **Mobile `tsc --noEmit`** under Node.js v26 has a binary compatibility issue (`basedir` shell script) — not a code bug; typecheck worked on Node v18/v20
- **Push token registration** requires Expo Notifications permission flow — test on device for full flow
- **Offline queue replay** — verified on emulator; device testing recommended

---

## 📲 Quick Start (QR Code)

To install via QR code instantly:

1. Scan the QR code below with **Expo Go** or the **Expo Apple/Android client**
2. Or visit: `https://expo.dev/standalone?slug=com.aahaarloop.mobile`

*(Note: The QR code is generated from the EAS Build. See the Release page on GitHub for the exact QR code image associated with this tag `v0.1.0`.)*