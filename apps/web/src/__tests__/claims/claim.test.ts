import { Claim, getClaimStatusColor, getPendingClaims } from "../lib/claims";

describe("getPendingClaims", () => {
  const claims: Claim[] = [
    {
      id: "1",
      donationId: "d1",
      donorId: "u1",
      status: "pending",
      createdAt: new Date("2026-11-20"),
    },
    {
      id: "2",
      donationId: "d2",
      donorId: "u1",
      status: "confirmed",
      createdAt: new Date("2026-11-19"),
    },
    {
      id: "3",
      donationId: "d3",
      donorId: "u2",
      status: "pending",
      createdAt: new Date("2026-11-18"),
    },
  ];

  it("returns only pending claims", () => {
    const result = getPendingClaims(claims);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when no pending claims", () => {
    const result = getPendingClaims(
      claims.filter((c) => c.status !== "pending"),
    );
    expect(result).toHaveLength(0);
  });
});

describe("getClaimStatusColor", () => {
  it("returns yellow for pending", () => {
    expect(getClaimStatusColor("pending")).toBe("yellow");
  });

  it("returns green for confirmed", () => {
    expect(getClaimStatusColor("confirmed")).toBe("green");
  });

  it("returns red for rejected", () => {
    expect(getClaimStatusColor("rejected")).toBe("red");
  });

  it("returns gray for unknown status", () => {
    expect(getClaimStatusColor("unknown" as Claim["status"])).toBe("gray");
  });
});
