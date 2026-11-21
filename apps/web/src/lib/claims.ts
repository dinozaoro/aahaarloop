export interface Claim {
  id: string;
  donationId: string;
  donorId: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: Date;
  confirmedAt?: Date;
}

export function getPendingClaims(claims: Claim[]): Claim[] {
  return claims.filter((claim) => claim.status === "pending");
}

export function getClaimStatusColor(status: Claim["status"]): string {
  switch (status) {
    case "pending":
      return "yellow";
    case "confirmed":
      return "green";
    case "rejected":
      return "red";
    default:
      return "gray";
  }
}
