import { signOut } from "@/auth";
import Link from "next/link";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import {
  ANDROID_APK_DOWNLOAD_URL,
  resolveAndroidDownloadUrl,
} from "@/lib/links";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const androidUrl =
    resolveAndroidDownloadUrl(process.env.NEXT_PUBLIC_ANDROID_APK_URL) ??
    ANDROID_APK_DOWNLOAD_URL;
  return <WorkspaceShell><div className="settings-page">
    <div className="page-heading"><div><p className="page-kicker">Bengaluru</p><h1>Make AahaarLoop work for you.</h1><p>Account settings, communication and privacy in one place.</p></div></div>
    <div className="settings-grid">
      <section className="settings-section"><h2>Notifications</h2><Link href="/settings/notifications" className="outline-action settings-action">Notification preferences</Link><div className="settings-row"><div><strong>Pickup &amp; delivery</strong><p>Updates when claim and pickup notifications are connected.</p></div><span className="settings-unavailable">Unavailable</span></div><div className="settings-row"><div><strong>Donation matches</strong><p>Nearby food updates require the shared notifications service.</p></div><span className="settings-unavailable">Unavailable</span></div><div className="settings-row"><div><strong>Community stories</strong><p>Optional community updates are not configured.</p></div><span className="settings-unavailable">Unavailable</span></div>
        <h2 className="settings-subheading">Accessibility</h2><div className="settings-row"><div><strong>Reduced motion</strong><p>AahaarLoop follows your device’s reduced-motion setting.</p></div><span className="settings-state">Device preference</span></div>
      </section>
      <section className="settings-section"><h2>Account</h2><p className="settings-account-note">Google manages sign-in and password security. AahaarLoop does not store a separate password.</p><Link href="/profile" className="outline-action settings-action">Profile information</Link><Link href="/onboarding" className="outline-action settings-action">Role and organization</Link>{androidUrl ? <a href={androidUrl} className="outline-action settings-action">Download Android</a> : <span className="outline-action settings-action settings-disabled" aria-disabled="true">Android download · URL pending</span>}<form action={async () => { "use server"; await signOut({ redirectTo: "/signin" }); }}><button type="submit" className="outline-action settings-action">Sign out</button></form><p className="settings-account-note">Privacy and data controls are not connected to the shared account service yet.</p></section>
    </div>
  </div></WorkspaceShell>;
}
