import { filterByStatus, filterByCategory } from "../lib/filters";

describe("donation filters", () => {
  const sampleDonations = [
    { id: "1", status: "active", category: "food" },
    { id: "2", status: "history", category: "food" },
    { id: "3", status: "active", category: "clothing" },
  ];

  describe("filterByStatus", () => {
    it("returns all donations when status is null", () => {
      expect(filterByStatus(sampleDonations, null)).toHaveLength(3);
    });

    it("filters by active status", () => {
      expect(filterByStatus(sampleDonations, "active")).toHaveLength(2);
    });

    it("filters by history status", () => {
      expect(filterByStatus(sampleDonations, "history")).toHaveLength(1);
    });
  });

  describe("filterByCategory", () => {
    it("returns all donations when category is null", () => {
      expect(filterByCategory(sampleDonations, null)).toHaveLength(3);
    });

    it("filters by food category", () => {
      expect(filterByCategory(sampleDonations, "food")).toHaveLength(2);
    });

    it("filters by clothing category", () => {
      expect(filterByCategory(sampleDonations, "clothing")).toHaveLength(1);
    });
  });
});
