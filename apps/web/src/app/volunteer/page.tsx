import Link from "next/link";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { getVolunteerProfile } from "@/lib/data/store";

export const metadata: Metadata = { title: "Volunteer home" };

export default function VolunteerHomePage() {
  const profile = getVolunteerProfile();
  return <WorkspaceShell><div className="volunteer-home">
    <div className="page-heading volunteer-heading"><div><p className="page-kicker">Bengaluru demo · Volunteer</p><h1>Your next good turn, {profile.displayName.split(" ")[0]}.</h1><p>Short journeys can help good food reach a nearby table.</p></div><Link href="/volunteer/profile" className="primary-action">Update availability</Link></div>
    <section className="volunteer-assignment-empty"><p className="page-kicker">Assignments</p><h2>No pickup assignments are connected yet.</h2><p>The current shared data does not include volunteer assignments or live route details. Your service area and availability are saved in this browser demo.</p><Link href="/volunteer/profile" className="outline-action">Review volunteer profile</Link></section>
    <section className="volunteer-profile-summary"><div><span>Service area</span><strong>{profile.serviceArea.radiusKm} km around your saved location</strong></div><div><span>Transport</span><strong>{profile.transportMode} · up to {profile.transportCapacityKg} kg</strong></div><div><span>Availability windows</span><strong>{profile.availability.length} saved</strong></div></section>
    <p className="sample-note">Volunteer assignment and delivery APIs are not connected. No map or live tracking is available in this preview.</p>
  </div></WorkspaceShell>;
}
