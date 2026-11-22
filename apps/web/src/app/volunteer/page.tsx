import Link from "next/link";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { getVolunteerProfile } from "@/lib/data/store";

export const metadata: Metadata = { title: "Volunteer home" };

export default function VolunteerHomePage() {
  const profile = getVolunteerProfile();
  return <WorkspaceShell><div className="volunteer-home">
    <div className="page-heading volunteer-heading"><div><p className="page-kicker">Bengaluru · Volunteer</p><h1>Your next good turn.</h1><p>Short journeys can help good food reach a nearby table.</p></div><Link href="/volunteer/profile" className="primary-action">{profile ? "Update availability" : "Set up profile"}</Link></div>
    <section className="volunteer-assignment-empty"><p className="page-kicker">Assignments</p><h2>No pickup assignments are connected yet.</h2><p>Service area and availability are saved in this browser once you create a profile.</p><Link href="/volunteer/profile" className="outline-action">Review volunteer profile</Link></section>
    <section className="volunteer-profile-summary"><div><span>Service area</span><strong>{profile ? `${profile.serviceArea.radiusKm} km around your saved location` : "Not saved yet"}</strong></div><div><span>Transport</span><strong>{profile ? `${profile.transportMode}${profile.transportCapacityKg ? ` · up to ${profile.transportCapacityKg} kg` : ""}` : "Not saved yet"}</strong></div><div><span>Availability windows</span><strong>{profile ? `${profile.availability.length} saved` : "Not saved yet"}</strong></div></section>
  </div></WorkspaceShell>;
}
