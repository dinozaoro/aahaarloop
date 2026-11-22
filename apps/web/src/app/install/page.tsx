import { WorkspaceShell } from "@/components/workspace-shell";
import { ANDROID_RELEASES_URL, resolveAndroidDownloadUrl } from "@/lib/links";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Android installation" };

export default function InstallPage() {
  const androidUrl = resolveAndroidDownloadUrl(
    process.env.NEXT_PUBLIC_ANDROID_APK_URL,
  );
  const downloadUrl = androidUrl ?? ANDROID_RELEASES_URL;
  return (
    <WorkspaceShell>
      <div className="install-page">
        <div className="page-heading">
          <div>
            <p className="page-kicker">Bengaluru</p>
            <h1>The loop, wherever you go.</h1>
            <p>
              Install AahaarLoop on Android, or continue using your browser.
            </p>
          </div>
        </div>
        <div className="install-layout">
          <section className="install-instructions">
            <h2>Android app</h2>
            <ol>
              <li>Download the APK from the official AahaarLoop release.</li>
              <li>Open the downloaded package on your Android device.</li>
              <li>
                Allow installation when Android asks about apps from this
                source.
              </li>
              <li>Open AahaarLoop and sign in with Google.</li>
            </ol>
            <a href={downloadUrl} className="primary-action">
              {androidUrl ? "Download APK" : "Open latest APK release"}
            </a>
            <Link
              href="/browse"
              className="outline-action install-browser-link"
            >
              Continue in web browser
            </Link>
          </section>
          <aside className="install-qr">
            <a
              href={ANDROID_RELEASES_URL}
              aria-label="Open the latest Android APK release on GitHub"
            >
              <Image
                src="/images/android-install-qr.png"
                alt="QR code linking to the latest AahaarLoop Android release"
                width={176}
                height={176}
              />
            </a>
            <h2>Scan to get the Android app</h2>
            <p>
              The latest release page includes the APK and a safe installation
              guide.
            </p>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}
