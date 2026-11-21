import type { Metadata } from "next";

import {
  matchDonationsForRecipient,
  type EligibleMatch,
  type UrgencyStatus,
} from "@aahaarloop/matching";

export const metadata: Metadata = {
  title: "Donor dashboard",
};

export default function DashboardPage() {
  const recipientRequests = matchDonationsForRecipient(
    {} as Parameters<typeof matchDonationsForRecipient>[0]
  );

  const activeDonations = recipientRequests.filter(
    (req): req is EligibleMatch => req.status === "active"
  );
  const expiringDonations = recipientRequests.filter(
    (req): req is EligibleMatch => req.status === "expiring"
  );
  const historyDonations = recipientRequests.filter(
    (req): req is EligibleMatch => req.status === "history"
  );

  return (
    <div>
      <h1>Donor Dashboard</h1>
      <h2>Active Donations</h2>
      <ul>
        {activeDonations.map((match) => (
          <li key={match.id}>
            {match.donorName}: {match.amount} - Status: {match.status}
          </li>
        ))}
      </ul>

      <h2>Expiring Soon</h2>
      <ul>
        {expiringDonations.map((match) => (
          <li key={match.id}>
            {match.donorName}: {match.amount} - Status: {match.status}
          </li>
        ))}
      </ul>

      <h2>History</h2>
      <ul>
        {historyDonations.map((match) => (
          <li key={match.id}>
            {match.donorName}: {match.amount} - Status: {match.status}
          </li>
        ))}
      </ul>
    </div>
  );
}