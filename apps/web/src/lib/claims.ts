export interface Claim {
  id: string;
  donationId: string;
  recipientId: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export function getPendingClaims(claims: Claim[]): Claim[] {
  return claims.filter((c: Claim) => c.status === "pending");
}

export function getClaimStatusColor(status: Claim["status"]): string {
  switch (status) {
    case "pending":
      return "yellow";
    case "confirmed":
      return "green";
    case "delivered":
      return "blue";
    case "cancelled":
      return "gray";
    default:
      return "gray";
  }
}