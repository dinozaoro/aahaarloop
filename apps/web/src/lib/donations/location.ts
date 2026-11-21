import type { DonationDraft, DonationLocationValues } from "./draft.ts";

export const FRACTIONAL_EXPLANATION =
  "Allow a recipient to claim part of this donation. The remaining servings stay available to others.";

export interface BengaluruLocality {
  id: string;
  name: string;
  area: string;
  pinCode: string;
  latitude: number;
  longitude: number;
}

/** Curated Bengaluru localities; the prototype does not call a geocoding API. */
export const BENGALURU_LOCALITIES: readonly BengaluruLocality[] = [
  {
    id: "indiranagar",
    name: "Indiranagar",
    area: "East Bengaluru",
    pinCode: "560038",
    latitude: 12.9719,
    longitude: 77.6412,
  },
  {
    id: "koramangala",
    name: "Koramangala",
    area: "South East Bengaluru",
    pinCode: "560095",
    latitude: 12.9352,
    longitude: 77.6245,
  },
  {
    id: "jayanagar",
    name: "Jayanagar",
    area: "South Bengaluru",
    pinCode: "560011",
    latitude: 12.925,
    longitude: 77.5938,
  },
  {
    id: "whitefield",
    name: "Whitefield",
    area: "East Bengaluru",
    pinCode: "560066",
    latitude: 12.9698,
    longitude: 77.75,
  },
  {
    id: "hsr-layout",
    name: "HSR Layout",
    area: "South East Bengaluru",
    pinCode: "560102",
    latitude: 12.9116,
    longitude: 77.6389,
  },
  {
    id: "malleshwaram",
    name: "Malleshwaram",
    area: "North West Bengaluru",
    pinCode: "560003",
    latitude: 13.0128,
    longitude: 77.554,
  },
  {
    id: "rt-nagar",
    name: "RT Nagar",
    area: "North Bengaluru",
    pinCode: "560032",
    latitude: 13.0215,
    longitude: 77.5964,
  },
  {
    id: "hebbal",
    name: "Hebbal",
    area: "North Bengaluru",
    pinCode: "560024",
    latitude: 13.0358,
    longitude: 77.597,
  },
  {
    id: "banashankari",
    name: "Banashankari",
    area: "South West Bengaluru",
    pinCode: "560070",
    latitude: 12.925,
    longitude: 77.546,
  },
  {
    id: "marathahalli",
    name: "Marathahalli",
    area: "East Bengaluru",
    pinCode: "560037",
    latitude: 12.9569,
    longitude: 77.7011,
  },
  {
    id: "electronic-city",
    name: "Electronic City",
    area: "South Bengaluru",
    pinCode: "560100",
    latitude: 12.8452,
    longitude: 77.6602,
  },
  {
    id: "basavanagudi",
    name: "Basavanagudi",
    area: "South Bengaluru",
    pinCode: "560004",
    latitude: 12.94,
    longitude: 77.575,
  },
];

export function searchBengaluruAddresses(query: string): BengaluruLocality[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  return BENGALURU_LOCALITIES.filter((locality) =>
    `${locality.name} ${locality.area} ${locality.pinCode}`
      .toLowerCase()
      .includes(needle),
  ).slice(0, 8);
}

export interface PickupLocationInput {
  address: string;
  localityId: string;
  pinPlaced: boolean;
  contactName: string;
  contactPhone: string;
  pickupInstructions: string;
  splittable: boolean;
}

export interface PickupLocationResult {
  values?: DonationLocationValues;
  errors: Record<string, string>;
}

export function validatePickupLocation(
  input: PickupLocationInput,
): PickupLocationResult {
  const errors: Record<string, string> = {};
  const address = input.address.trim();
  const contactName = input.contactName.trim();
  const pickupInstructions = input.pickupInstructions.trim();
  const locality = BENGALURU_LOCALITIES.find(
    (item) => item.id === input.localityId,
  );

  if (address.length < 3 || address.length > 160) {
    errors.address = "Enter a street address of at least 3 characters.";
  }
  if (!locality) {
    errors.locality = "Choose a Bengaluru locality from the search results.";
  }
  if (!input.pinPlaced || !locality) {
    errors.pin = "Place the map pin before saving pickup details.";
  }
  if (contactName.length < 2) {
    errors.contactName = "Enter a contact name.";
  }
  if (!/^\+?\d[\d\s-]{7,16}$/.test(input.contactPhone.trim())) {
    errors.contactPhone = "Enter a reachable phone number.";
  }
  if (pickupInstructions.length > 300) {
    errors.pickupInstructions = "Keep instructions under 300 characters.";
  }

  if (Object.keys(errors).length > 0 || !locality) return { errors };

  return {
    errors,
    values: {
      address,
      locality: locality.name,
      latitude: locality.latitude,
      longitude: locality.longitude,
      contactName,
      contactPhone: input.contactPhone.trim(),
      pickupInstructions,
      splittable: input.splittable,
    },
  };
}

export interface PublishedDonation {
  status: "published";
  publishedAt: string;
  dates: NonNullable<DonationDraft["dates"]>;
  location: DonationLocationValues;
}

export function publishDraft(
  draft: DonationDraft,
  now: Date = new Date(),
): { donation?: PublishedDonation; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!draft.dates) errors.dates = "Complete the dates step first.";
  if (!draft.location) errors.location = "Save pickup details first.";
  if (Object.keys(errors).length > 0 || !draft.dates || !draft.location) {
    return { errors };
  }
  return {
    errors,
    donation: {
      status: "published",
      publishedAt: now.toISOString(),
      dates: draft.dates,
      location: draft.location,
    },
  };
}
