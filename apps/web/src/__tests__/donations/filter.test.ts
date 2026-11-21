import { filterByCategory, filterByStatus } from "../lib/filters";

describe("filterByStatus", () => {
  const donations = [
    { id: 1, status: "active", category: "education" },
    { id: 2, status: "expiring", category: "health" },
    { id: 3, status: "history", category: "education" },
    { id: 4, status: "active", category: "environment" },
  ];

  it("filters by active status", () => {
    const result = filterByStatus(donations, "active");
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id)).toEqual([1, 4]);
  });

  it("filters by expiring status", () => {
    const result = filterByStatus(donations, "expiring");
    expect(result).toHaveLength(1);
    expect(result.map((d) => d.id)).toEqual([2]);
  });

  it("filters by history status", () => {
    const result = filterByStatus(donations, "history");
    expect(result).toHaveLength(1);
    expect(result.map((d) => d.id)).toEqual([3]);
  });

  it("filters by infeasible status (no matches)", () => {
    const result = filterByStatus(donations, "infeasible");
    expect(result).toHaveLength(0);
  });
});

describe("filterByCategory", () => {
  const donations = [
    { id: 1, status: "active", category: "education" },
    { id: 2, status: "expiring", category: "health" },
    { id: 3, status: "history", category: "education" },
    { id: 4, status: "active", category: "environment" },
  ];

  it("filters by education category", () => {
    const result = filterByCategory(donations, "education");
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id)).toEqual([1, 3]);
  });

  it("filters by health category", () => {
    const result = filterByCategory(donations, "health");
    expect(result).toHaveLength(1);
    expect(result.map((d) => d.id)).toEqual([2]);
  });

  it("filters by environment category", () => {
    const result = filterByCategory(donations, "environment");
    expect(result).toHaveLength(1);
    expect(result.map((d) => d.id)).toEqual([4]);
  });

  it("filters by non-existent category (no matches)", () => {
    const result = filterByCategory(donations, "unknown");
    expect(result).toHaveLength(0);
  });
});
