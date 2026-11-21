import { Claim, getPendingClaims, getClaimStatusColor } from "../lib/claims";

describe("claim utilities", () => {
  const sampleClaims: Claim[] = [
    { id: "1", donationId: "d1", recipientId: "r1", status: "pending", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "2", donationId: "d1", recipientId: "r1", status: "confirmed", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "3", donationId: "d1", recipientId: "r1", status: "delivered", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  ];

  describe("getPendingClaims", () => {
    it("returns pending claims", () => {
      expect(getPendingClaims(sampleClaims)).toHaveLength(1);
      expect(getPendingClaims(sampleClaims)[0].id).toBe("1");
    });

    it("returns empty array when no pending claims", () => {
      const noPending = [
        { id: "2", donationId: "d1", recipientId: "r1", status: "confirmed", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      ];
      expect(getPendingClaims(noPending)).toHaveLength(0);
    });
  });

  describe("getClaimStatusColor", () => {
    it("returns yellow for pending", () => {
      expect(getClaimStatusColor("pending")).toBe("yellow");
    });

    it("returns green for confirmed", () => {
      expect(getClaimStatusColor("confirmed")).toBe("green");
    });

    it("returns blue for delivered", () => {
      expect(getClaimStatusColor("delivered")).toBe("blue");
    });

    it("returns grey for cancelled", () => {
      expect(getClaimStatusColor("cancelled")).toBe("gray");
    });
  });
});
