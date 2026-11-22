const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const plusHours = (now: Date, hours: number) =>
  new Date(now.getTime() + hours * 3_600_000);

/** Fixed identifiers let the seed be replayed with conflict-safe inserts. */
export const DEMO_IDS = {
  donorOrg: id(1),
  recipientOrg: id(2),
  volunteerOrg: id(3),
  donorUser: id(11),
  recipientUser: id(12),
  volunteerUser: id(13),
  adminUser: id(14),
  categories: [id(21), id(22), id(23), id(24), id(25), id(26)] as const,
  allergens: [id(31), id(32), id(33), id(34), id(35), id(36)] as const,
  donations: [id(41), id(42), id(43), id(44), id(45)] as const,
  claims: [id(51), id(52)] as const,
  needs: [id(61), id(62)] as const,
  pickupTask: id(81),
  pickupAssignment: id(82),
} as const;

export const DEMO_EMAILS = {
  donor: "donor@demo.aahaarloop.test",
  recipient: "recipient@demo.aahaarloop.test",
  volunteer: "volunteer@demo.aahaarloop.test",
  admin: "admin@demo.aahaarloop.test",
} as const;

export interface SeedData {
  organizations: unknown[];
  users: unknown[];
  organizationMembers: unknown[];
  foodCategories: unknown[];
  foodAllergens: unknown[];
  donations: unknown[];
  donationItems: unknown[];
  donationAllergens: unknown[];
  recipientNeeds: unknown[];
  claims: unknown[];
  claimItems: unknown[];
  pickupTasks: unknown[];
  pickupAssignments: unknown[];
  donationImages: unknown[];
  favorites: unknown[];
}

/**
 * Build deterministic demo data relative to `now` so deadlines stay meaningful
 * whenever the seed is run. All locations are in Bengaluru, India.
 */
export function buildSeedData(now: Date = new Date()): SeedData {
  const [meals, produce, bakery, dairy, fruits, snacks] = DEMO_IDS.categories;
  const [peanut, gluten, milk, egg, soy, sesame] = DEMO_IDS.allergens;
  const [critical, high, medium, low, draft] = DEMO_IDS.donations;
  const verifiedAt = new Date("2026-01-01T00:00:00Z");

  return {
    organizations: [
      {
        id: DEMO_IDS.donorOrg,
        name: "Annapurna Community Kitchen",
        slug: "annapurna-community-kitchen",
        type: "donor",
        description: "Cooks surplus meals for nearby shelters.",
        address: "12th Main, Indiranagar, Bengaluru",
        latitude: "12.9719000",
        longitude: "77.6412000",
        email: DEMO_EMAILS.donor,
        verifiedAt,
      },
      {
        id: DEMO_IDS.recipientOrg,
        name: "Hope Shelter",
        slug: "hope-shelter",
        type: "recipient",
        description: "Community kitchen serving 120 residents.",
        address: "80 Feet Road, Koramangala, Bengaluru",
        latitude: "12.9352000",
        longitude: "77.6245000",
        email: DEMO_EMAILS.recipient,
        verifiedAt,
      },
      {
        id: DEMO_IDS.volunteerOrg,
        name: "Green Riders Collective",
        slug: "green-riders-collective",
        type: "volunteer",
        description: "Volunteer pickup network.",
        address: "Jayanagar 4th Block, Bengaluru",
        latitude: "12.9299000",
        longitude: "77.5838000",
        email: DEMO_EMAILS.volunteer,
        verifiedAt,
      },
    ],
    users: [
      {
        id: DEMO_IDS.donorUser,
        email: DEMO_EMAILS.donor,
        name: "Meera Rao",
        role: "donor",
        activeOrganizationId: DEMO_IDS.donorOrg,
        emailVerifiedAt: verifiedAt,
      },
      {
        id: DEMO_IDS.recipientUser,
        email: DEMO_EMAILS.recipient,
        name: "Fatima Khan",
        role: "recipient",
        activeOrganizationId: DEMO_IDS.recipientOrg,
        emailVerifiedAt: verifiedAt,
      },
      {
        id: DEMO_IDS.volunteerUser,
        email: DEMO_EMAILS.volunteer,
        name: "Arun Kumar",
        role: "volunteer",
        activeOrganizationId: DEMO_IDS.volunteerOrg,
        emailVerifiedAt: verifiedAt,
      },
      {
        id: DEMO_IDS.adminUser,
        email: DEMO_EMAILS.admin,
        name: "Priya Menon",
        role: "admin",
        activeOrganizationId: DEMO_IDS.donorOrg,
        emailVerifiedAt: verifiedAt,
      },
    ],
    organizationMembers: [
      {
        organizationId: DEMO_IDS.donorOrg,
        userId: DEMO_IDS.donorUser,
        role: "owner",
      },
      {
        organizationId: DEMO_IDS.recipientOrg,
        userId: DEMO_IDS.recipientUser,
        role: "owner",
      },
      {
        organizationId: DEMO_IDS.volunteerOrg,
        userId: DEMO_IDS.volunteerUser,
        role: "owner",
      },
      {
        organizationId: DEMO_IDS.donorOrg,
        userId: DEMO_IDS.adminUser,
        role: "admin",
      },
    ],
    foodCategories: [
      {
        id: meals,
        name: "Cooked meals",
        slug: "cooked-meals",
        icon: "utensils",
      },
      {
        id: produce,
        name: "Fresh produce",
        slug: "fresh-produce",
        icon: "leaf",
      },
      { id: bakery, name: "Bakery", slug: "bakery", icon: "croissant" },
      { id: dairy, name: "Dairy", slug: "dairy", icon: "milk" },
      { id: fruits, name: "Fruits", slug: "fruits", icon: "apple" },
      { id: snacks, name: "Snacks", slug: "snacks", icon: "cookie" },
    ],
    foodAllergens: [
      { id: peanut, name: "Peanut", slug: "peanut" },
      { id: gluten, name: "Gluten", slug: "gluten" },
      { id: milk, name: "Milk", slug: "milk" },
      { id: egg, name: "Egg", slug: "egg" },
      { id: soy, name: "Soy", slug: "soy" },
      { id: sesame, name: "Sesame", slug: "sesame" },
    ],
    donations: [
      {
        id: critical,
        organizationId: DEMO_IDS.donorOrg,
        createdByUserId: DEMO_IDS.donorUser,
        title: "Hot vegetarian lunch boxes",
        description: "40 sealed lunch boxes from today's kitchen surplus.",
        categoryId: meals,
        status: "published",
        foodExpiryAt: plusHours(now, 2),
        pickupDeadlineAt: plusHours(now, 2),
        bestBeforeAt: plusHours(now, 6),
        effectiveDeadlineAt: plusHours(now, 2),
        quantity: 40,
        remainingQuantity: 12,
        quantityUnit: "servings",
        storage: "refrigerated",
        packaging: "Sealed compostable boxes",
        address: "12th Main, Indiranagar, Bengaluru",
        latitude: "12.9719000",
        longitude: "77.6412000",
        contactName: "Kitchen desk",
        contactPhone: "+91-80000-00001",
        pickupInstructions: "Collect from the rear delivery door.",
        splittable: true,
        publishedAt: now,
      },
      {
        id: high,
        organizationId: DEMO_IDS.donorOrg,
        createdByUserId: DEMO_IDS.donorUser,
        title: "Fresh fruit baskets",
        description: "Seasonal fruit suitable for a community kitchen.",
        categoryId: fruits,
        status: "published",
        foodExpiryAt: plusHours(now, 30),
        pickupDeadlineAt: plusHours(now, 5),
        effectiveDeadlineAt: plusHours(now, 5),
        quantity: 30,
        remainingQuantity: 30,
        quantityUnit: "servings",
        storage: "ambient",
        address: "80 Feet Road, Koramangala, Bengaluru",
        latitude: "12.9352000",
        longitude: "77.6245000",
        splittable: true,
        publishedAt: now,
      },
      {
        id: medium,
        organizationId: DEMO_IDS.donorOrg,
        createdByUserId: DEMO_IDS.donorUser,
        title: "Bakery surplus",
        description: "Unsold bread and pastries from a partner bakery.",
        categoryId: bakery,
        status: "published",
        foodExpiryAt: plusHours(now, 10),
        pickupDeadlineAt: plusHours(now, 9),
        effectiveDeadlineAt: plusHours(now, 9),
        quantity: 60,
        remainingQuantity: 45,
        quantityUnit: "pieces",
        storage: "ambient",
        address: "Jayanagar 4th Block, Bengaluru",
        latitude: "12.9299000",
        longitude: "77.5838000",
        splittable: false,
        publishedAt: now,
      },
      {
        id: low,
        organizationId: DEMO_IDS.donorOrg,
        createdByUserId: DEMO_IDS.donorUser,
        title: "Rice and dal packets",
        description: "Shelf-stable staples for later distribution.",
        categoryId: meals,
        status: "published",
        foodExpiryAt: plusHours(now, 72),
        pickupDeadlineAt: plusHours(now, 20),
        effectiveDeadlineAt: plusHours(now, 20),
        quantity: 80,
        remainingQuantity: 80,
        quantityUnit: "servings",
        storage: "ambient",
        address: "Whitefield, Bengaluru",
        latitude: "12.9698000",
        longitude: "77.7499000",
        splittable: true,
        publishedAt: now,
      },
      {
        id: draft,
        organizationId: DEMO_IDS.donorOrg,
        createdByUserId: DEMO_IDS.donorUser,
        title: "Tomorrow's sandwich platter",
        description: "Draft offer kept for the create-donation flow demo.",
        categoryId: meals,
        status: "draft",
        quantity: 25,
        remainingQuantity: 25,
        quantityUnit: "servings",
        storage: "refrigerated",
      },
    ],
    donationItems: [
      {
        id: id(71),
        donationId: critical,
        name: "Vegetarian thali",
        categoryId: meals,
        quantity: 40,
        unit: "servings",
        foodExpiryAt: plusHours(now, 2),
        bestBeforeAt: plusHours(now, 6),
        storage: "refrigerated",
      },
      {
        donationId: high,
        name: "Mixed fruit basket",
        categoryId: fruits,
        quantity: 30,
        unit: "servings",
        foodExpiryAt: plusHours(now, 30),
        storage: "ambient",
      },
      {
        donationId: medium,
        name: "Assorted bread",
        categoryId: bakery,
        quantity: 60,
        unit: "pieces",
        foodExpiryAt: plusHours(now, 10),
        storage: "ambient",
      },
      {
        donationId: low,
        name: "Rice and dal packet",
        categoryId: meals,
        quantity: 80,
        unit: "servings",
        foodExpiryAt: plusHours(now, 72),
        storage: "ambient",
      },
    ],
    donationAllergens: [
      { donationId: critical, allergenId: peanut },
      { donationId: medium, allergenId: gluten },
      { donationId: medium, allergenId: milk },
      { donationId: high, allergenId: sesame },
    ],
    donationImages: [],
    recipientNeeds: [
      {
        id: DEMO_IDS.needs[0],
        organizationId: DEMO_IDS.recipientOrg,
        createdByUserId: DEMO_IDS.recipientUser,
        categoryId: meals,
        name: "Evening meals",
        quantity: 50,
        unit: "servings",
        neededBy: plusHours(now, 24),
      },
      {
        id: DEMO_IDS.needs[1],
        organizationId: DEMO_IDS.recipientOrg,
        createdByUserId: DEMO_IDS.recipientUser,
        categoryId: produce,
        name: "Fresh vegetables",
        quantity: 20,
        unit: "kilograms",
        neededBy: plusHours(now, 48),
      },
    ],
    claims: [
      {
        id: DEMO_IDS.claims[0],
        donationId: critical,
        recipientOrgId: DEMO_IDS.recipientOrg,
        claimedByUserId: DEMO_IDS.recipientUser,
        status: "confirmed",
        quantity: 12,
        unit: "servings",
        expiresAt: plusHours(now, 1),
        confirmedAt: now,
      },
      {
        id: DEMO_IDS.claims[1],
        donationId: high,
        recipientOrgId: DEMO_IDS.recipientOrg,
        claimedByUserId: DEMO_IDS.recipientUser,
        status: "pending",
        quantity: 10,
        unit: "servings",
        expiresAt: plusHours(now, 2),
      },
    ],
    claimItems: [
      {
        claimId: DEMO_IDS.claims[0],
        donationItemId: id(71),
        quantity: 12,
      },
    ],
    pickupTasks: [
      {
        id: DEMO_IDS.pickupTask,
        donationId: critical,
        claimId: DEMO_IDS.claims[0],
        status: "assigned",
        windowStart: plusHours(now, 1),
        windowEnd: plusHours(now, 2),
        address: "12th Main, Indiranagar, Bengaluru",
        latitude: "12.9719000",
        longitude: "77.6412000",
        capacityKg: 15,
        notes: "Collect 12 sealed lunch boxes from the rear delivery door.",
      },
    ],
    pickupAssignments: [
      {
        id: DEMO_IDS.pickupAssignment,
        taskId: DEMO_IDS.pickupTask,
        volunteerId: DEMO_IDS.volunteerUser,
        status: "assigned",
        assignedAt: now,
      },
    ],
    favorites: [{
      userId: DEMO_IDS.recipientUser,
      donationId: low,
      organizationId: DEMO_IDS.recipientOrg,
    }],
  };
}
