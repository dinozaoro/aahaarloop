import Link from "next/link";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { resolveAndroidDownloadUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Android installation" };

export default function InstallPage() {
  const androidUrl = resolveAndroidDownloadUrl(process.env.NEXT_PUBLIC_ANDROID_APK_URL);
  return <WorkspaceShell><div className="install-page">
    <div className="page-heading"><div><p className="page-kicker">Bengaluru</p><h1>The loop, wherever you go.</h1><p>Install AahaarLoop on Android, or continue using your browser.</p></div></div>
    <div className="install-layout"><section className="install-instructions"><h2>Android app</h2>{androidUrl ? <><ol><li>Download the APK from the configured AahaarLoop source.</li><li>Open the downloaded package on your Android device.</li><li>Review the source before allowing installation.</li><li>Open AahaarLoop and sign in.</li></ol><a href={androidUrl} className="primary-action">Download APK</a></> : <><p>The Android package has not been published yet.</p><span className="primary-action is-unavailable" aria-disabled="true">Download APK · URL pending</span><p className="install-note">This preview does not have an APK URL. The installation link and QR code will appear after the official package is published.</p></>}<Link href="/browse" className="outline-action install-browser-link">Continue in web browser</Link></section>
      <aside className="install-qr"><div className="install-qr-placeholder" aria-label="QR code unavailable">{androidUrl ? "QR not configured" : "URL pending"}</div><h2>Scan to install on Android</h2><p>A QR code can be added when the official APK URL is available.</p></aside>
    </div>
  </div></WorkspaceShell>;
}
