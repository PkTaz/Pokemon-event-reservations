import { PLACEMENT_OPTIONS } from "./constants";
import type { BookingFormData, ColorPreference, Placement } from "./types";

const PLACEMENTS: Placement[] = PLACEMENT_OPTIONS.map((option) => option.value);
const COLOR_PREFERENCES: ColorPreference[] = [
  "color",
  "black_gray",
  "artist_recommendation",
];

export function isValidPlacement(value: unknown): value is Placement {
  return typeof value === "string" && PLACEMENTS.includes(value as Placement);
}

export function isValidColorPreference(
  value: unknown,
): value is ColorPreference {
  return (
    typeof value === "string" &&
    COLOR_PREFERENCES.includes(value as ColorPreference)
  );
}

export type ValidationErrors = Partial<Record<keyof BookingFormData, string>>;

export function validateBookingForm(
  data: Partial<BookingFormData>,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.artistId?.trim()) {
    errors.artistId = "Artist is required.";
  }

  if (!data.slotId?.trim()) {
    errors.slotId = "Time slot is required.";
  }

  if (!data.name?.trim()) {
    errors.name = "Name is required.";
  }

  if (!data.phone?.trim()) {
    errors.phone = "Phone is required.";
  }

  if (!data.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!data.placement) {
    errors.placement = "Please select a placement area.";
  } else if (!isValidPlacement(data.placement)) {
    errors.placement = "Invalid placement selection.";
  }

  if (!data.colorPreference) {
    errors.colorPreference = "Please select a color preference.";
  } else if (!isValidColorPreference(data.colorPreference)) {
    errors.colorPreference = "Invalid color preference.";
  }

  if (!data.confirmPackPull) {
    errors.confirmPackPull =
      "You must confirm the pack-pull process for this event.";
  }

  if (!data.confirmArtistApproval) {
    errors.confirmArtistApproval =
      "You must confirm size and placement approval by your artist.";
  }

  if (!data.confirmAgeAndId) {
    errors.confirmAgeAndId = "You must confirm you are 18+ and will bring ID.";
  }

  return errors;
}
