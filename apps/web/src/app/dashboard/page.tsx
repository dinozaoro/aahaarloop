import type { Metadata } from "next";

import {
  matchDonationsForRecipient,
  type DonationCandidate,
  type EligibleMatch,
  type RecipientRequest,
} from "@aahaarloop/matching";

export const metadata: Metadata = {
  title: "Donor dashboard",
};

const emptyRecipient: RecipientRequest = {
  id: "recipient-1",
  location: { latitude: 0, longitude: 0 },
  needs: [],
  requiredServings: 0,
  storage: "ambient",
  transportCapacityKg: 0,
  volunteerAvailability: [],
};

const emptyDonations: readonly DonationCandidate[] = [];

export default function DashboardPage() {
  const { matches } = matchDonationsForRecipient(
    emptyRecipient,
    emptyDonations,
    { now: "2026-11-21T10:00:00Z" }
  );

  const activeDonations = matches.filter(
    (match: EligibleMatch): match is EligibleMatch =>
      match.explanation.urgency.level === "critical" ||
      match.explanation.urgency.level === "high"
  );
  const expiringDonations = matches.filter(
    (match: EligibleMatch): match is EligibleMatch =>
      match.explanation.urgency.level === "medium"
  );
  const historyDonations = matches.filter(
    (match: EligibleMatch): match is EligibleMatch =>
      match.explanation.urgency.level === "low"
  );

  return (
    <div>
      <h1>Donor Dashboard</h1>
      <h2>Active Donations</h2>
      <ul>
        {activeDonations.map((match) => (
          <li key={match.donationId}>
            Donation {match.donationId} - Score: {match.totalScore}
          </li>
        ))}
      </ul>

      <h2>Expiring Soon</h2>
      <ul>
        {expiringDonations.map((match) => (
          <li key={match.donationId}>
            Donation {match.donationId} - Score: {match.totalScore}
          </li>
        ))}
      </ul>

      <h2>History</h2>
      <ul>
        {historyDonations.map((match) => (
          <li key={match.donationId}>
            Donation {match.donationId} - Score: {match.totalScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
