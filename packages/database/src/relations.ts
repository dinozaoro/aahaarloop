import { relations } from "drizzle-orm";

import {
  claimItems,
  claims,
  donationEvents,
  notifications,
  pickupAssignments,
  pickupTasks,
} from "./claims.ts";
import {
  donationAllergens,
  donationImages,
  donationItems,
  donations,
  favorites,
  foodAllergens,
  foodCategories,
  recipientNeeds,
} from "./donations.ts";
import {
  deviceSessions,
  donorProfiles,
  organizationMembers,
  organizations,
  profiles,
  recipientProfiles,
  users,
  volunteerProfiles,
} from "./identity.ts";
import {
  aiAnalysis,
  auditLogs,
  impactRecords,
  reports,
  syncConflicts,
  syncOperations,
} from "./operations.ts";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  activeOrganization: one(organizations, {
    fields: [users.activeOrganizationId],
    references: [organizations.id],
  }),
  memberships: many(organizationMembers),
  donorProfile: one(donorProfiles),
  recipientProfile: one(recipientProfiles),
  volunteerProfile: one(volunteerProfiles),
  createdDonations: many(donations),
  favorites: many(favorites),
  notifications: many(notifications),
  devices: many(deviceSessions),
  pickupAssignments: many(pickupAssignments),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    members: many(organizationMembers),
    donations: many(donations),
    recipientNeeds: many(recipientNeeds),
    claims: many(claims),
    impactRecords: many(impactRecords),
  }),
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const donorProfilesRelations = relations(donorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [donorProfiles.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [donorProfiles.organizationId],
    references: [organizations.id],
  }),
}));

export const recipientProfilesRelations = relations(
  recipientProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [recipientProfiles.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [recipientProfiles.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const volunteerProfilesRelations = relations(
  volunteerProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [volunteerProfiles.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [volunteerProfiles.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const deviceSessionsRelations = relations(deviceSessions, ({ one }) => ({
  user: one(users, {
    fields: [deviceSessions.userId],
    references: [users.id],
  }),
}));

export const foodCategoriesRelations = relations(
  foodCategories,
  ({ one, many }) => ({
    parent: one(foodCategories, {
      fields: [foodCategories.parentId],
      references: [foodCategories.id],
      relationName: "category_parent",
    }),
    children: many(foodCategories, { relationName: "category_parent" }),
    donations: many(donations),
    donationItems: many(donationItems),
    recipientNeeds: many(recipientNeeds),
  }),
);

export const foodAllergensRelations = relations(foodAllergens, ({ many }) => ({
  donationAllergens: many(donationAllergens),
}));

export const donationsRelations = relations(donations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [donations.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [donations.createdByUserId],
    references: [users.id],
  }),
  category: one(foodCategories, {
    fields: [donations.categoryId],
    references: [foodCategories.id],
  }),
  items: many(donationItems),
  images: many(donationImages),
  allergens: many(donationAllergens),
  claims: many(claims),
  events: many(donationEvents),
  favorites: many(favorites),
  pickupTasks: many(pickupTasks),
  aiAnalyses: many(aiAnalysis),
  reports: many(reports),
  impactRecords: many(impactRecords),
}));

export const donationItemsRelations = relations(donationItems, ({ one }) => ({
  donation: one(donations, {
    fields: [donationItems.donationId],
    references: [donations.id],
  }),
  category: one(foodCategories, {
    fields: [donationItems.categoryId],
    references: [foodCategories.id],
  }),
}));

export const donationImagesRelations = relations(donationImages, ({ one }) => ({
  donation: one(donations, {
    fields: [donationImages.donationId],
    references: [donations.id],
  }),
  uploadedBy: one(users, {
    fields: [donationImages.uploadedByUserId],
    references: [users.id],
  }),
}));

export const donationAllergensRelations = relations(
  donationAllergens,
  ({ one }) => ({
    donation: one(donations, {
      fields: [donationAllergens.donationId],
      references: [donations.id],
    }),
    allergen: one(foodAllergens, {
      fields: [donationAllergens.allergenId],
      references: [foodAllergens.id],
    }),
  }),
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  donation: one(donations, {
    fields: [favorites.donationId],
    references: [donations.id],
  }),
}));

export const recipientNeedsRelations = relations(recipientNeeds, ({ one }) => ({
  organization: one(organizations, {
    fields: [recipientNeeds.organizationId],
    references: [organizations.id],
  }),
  category: one(foodCategories, {
    fields: [recipientNeeds.categoryId],
    references: [foodCategories.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  donation: one(donations, {
    fields: [claims.donationId],
    references: [donations.id],
  }),
  recipientOrganization: one(organizations, {
    fields: [claims.recipientOrgId],
    references: [organizations.id],
  }),
  claimedBy: one(users, {
    fields: [claims.claimedByUserId],
    references: [users.id],
  }),
  items: many(claimItems),
  pickupTasks: many(pickupTasks),
  events: many(donationEvents),
}));

export const claimItemsRelations = relations(claimItems, ({ one }) => ({
  claim: one(claims, { fields: [claimItems.claimId], references: [claims.id] }),
  donationItem: one(donationItems, {
    fields: [claimItems.donationItemId],
    references: [donationItems.id],
  }),
}));

export const pickupTasksRelations = relations(pickupTasks, ({ one, many }) => ({
  donation: one(donations, {
    fields: [pickupTasks.donationId],
    references: [donations.id],
  }),
  claim: one(claims, {
    fields: [pickupTasks.claimId],
    references: [claims.id],
  }),
  assignments: many(pickupAssignments),
}));

export const pickupAssignmentsRelations = relations(
  pickupAssignments,
  ({ one }) => ({
    task: one(pickupTasks, {
      fields: [pickupAssignments.taskId],
      references: [pickupTasks.id],
    }),
    volunteer: one(users, {
      fields: [pickupAssignments.volunteerId],
      references: [users.id],
    }),
  }),
);

export const donationEventsRelations = relations(donationEvents, ({ one }) => ({
  donation: one(donations, {
    fields: [donationEvents.donationId],
    references: [donations.id],
  }),
  claim: one(claims, {
    fields: [donationEvents.claimId],
    references: [claims.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const syncOperationsRelations = relations(
  syncOperations,
  ({ many }) => ({ conflicts: many(syncConflicts) }),
);

export const syncConflictsRelations = relations(syncConflicts, ({ one }) => ({
  operation: one(syncOperations, {
    fields: [syncConflicts.operationId],
    references: [syncOperations.id],
  }),
}));

export const aiAnalysisRelations = relations(aiAnalysis, ({ one }) => ({
  donation: one(donations, {
    fields: [aiAnalysis.donationId],
    references: [donations.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  donation: one(donations, {
    fields: [reports.donationId],
    references: [donations.id],
  }),
  claim: one(claims, { fields: [reports.claimId], references: [claims.id] }),
}));

export const auditLogsRelations = relations(auditLogs, () => ({}));

export const impactRecordsRelations = relations(impactRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [impactRecords.organizationId],
    references: [organizations.id],
  }),
  donation: one(donations, {
    fields: [impactRecords.donationId],
    references: [donations.id],
  }),
  claim: one(claims, {
    fields: [impactRecords.claimId],
    references: [claims.id],
  }),
}));
