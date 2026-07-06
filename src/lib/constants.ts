/** Event runs 10:00 AM – 6:00 PM (last bookable slot ends 5:30 PM). */
export const EVENT_DATE_LABEL = "Flash Event Day";

export const EVENT_RULES = [
  "Your tattoo creature is chosen by the pack you open at the event — not in advance.",
  "Trainer parties show each artist's favorite Pokémon only — your tattoo comes from a random pack, not their party.",
  "All tattoos use preset flash designs — this is flash work, so designs are not customizable.",
  "You may pull a rare card for a chance at a special bonus design.",
  "Each appointment is 1 hour 30 minutes with your selected artist.",
  "Final tattoo size and placement must be approved by your artist.",
  "You must be 18+ and bring valid government-issued ID.",
  "Arrive 10 minutes before your scheduled time.",
  "One booking per person. Spots are limited — 15 per event day across all artists.",
] as const;

/** Shown wherever trainer parties are displayed. */
export const TRAINER_PARTY_NOTE =
  "Each trainer's party is their personal favorites — not what you'll pull. All packs are random at the event.";

export const BOOKING_ACKNOWLEDGEMENT_ITEMS = [
  {
    key: "confirmPackPull" as const,
    label:
      "I understand my tattoo creature is determined by the pack I open at the event, and all designs are preset flash — not customizable.",
  },
  {
    key: "confirmArtistApproval" as const,
    label:
      "I understand final tattoo size and placement must be approved by my artist.",
  },
  {
    key: "confirmAgeAndId" as const,
    label: "I confirm I am 18+ and will bring valid government-issued ID.",
  },
] as const;

export const EVENT_REMINDERS = [
  "Arrive 10 minutes early.",
  "Bring valid government-issued ID.",
  "Your creature is determined by the pack you open at the event.",
  "All designs are preset flash — not customizable.",
  "You may pull a rare card for a chance at a special bonus design.",
  "Final tattoo size and placement must be approved by your artist.",
] as const;

export const PLACEMENT_OPTIONS = [
  { value: "arms" as const, label: "Arms" },
  { value: "legs" as const, label: "Legs" },
  { value: "unsure_yet" as const, label: "Unsure yet" },
] as const;

export const COLOR_PREFERENCE_OPTIONS = [
  { value: "color" as const, label: "Color" },
  { value: "black_gray" as const, label: "Black & Grey" },
  { value: "artist_recommendation" as const, label: "Artist Recommendation" },
] as const;

export const BOOKING_STATUS_OPTIONS = [
  "Confirmed",
  "Checked In",
  "With Artist",
  "Completed",
  "No Show",
] as const;

/** @deprecated Slot templates live in lib/data/event-days.ts */
export const TIME_SLOT_TEMPLATES = [
  { startTime: "10:00", endTime: "11:30" },
  { startTime: "11:30", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:30" },
  { startTime: "14:30", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:30" },
] as const;

/** How long a slot stays reserved while someone is on the booking form. */
export const SLOT_HOLD_MINUTES = 5;
export const SLOT_HOLD_MS = SLOT_HOLD_MINUTES * 60 * 1000;

/**
 * Signups unlock Tuesday July 7, 2026 at 10:00 AM Eastern.
 * Override with SIGNUP_UNLOCK_AT (ISO string) for testing.
 * Set SIGNUPS_UNLOCKED=true to bypass the countdown during development.
 */
export function getSignupUnlockTime(): Date {
  const override = process.env.SIGNUP_UNLOCK_AT;
  if (override) {
    return new Date(override);
  }

  return new Date("2026-07-07T10:00:00-04:00");
}

/** Locked until unlock time unless SIGNUPS_UNLOCKED=true (dev bypass). */
export function isSignupsOpen(now: Date = new Date()): boolean {
  if (process.env.SIGNUPS_UNLOCKED === "true") {
    return true;
  }
  return now >= getSignupUnlockTime();
}

export function formatSignupUnlockLabel(): string {
  const unlock = getSignupUnlockTime();
  return unlock.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}
