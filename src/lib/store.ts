import { generateBookingSummary } from "./ai";
import { EVENT_DAYS } from "./data/event-days";
import { ARTISTS } from "./data/artists";
import { getArtistById } from "./data/artists";
import {
  buildSlotCatalog,
  getSlotById,
  migrateLegacySlotId,
} from "./data/slots";
import { SLOT_HOLD_MS } from "./constants";
import {
  isValidColorPreference,
  isValidPlacement,
  validateBookingForm,
} from "./validation";
import type {
  Booking,
  BookingFormData,
  BookingStatus,
  ClaimSlotHoldResult,
  CreateBookingResult,
  Slot,
  SlotHold,
} from "./types";

/**
 * In-memory store — swap this module for Supabase/Postgres later.
 * Uses a global singleton so dev hot-reload keeps state within a process.
 */
interface StoreState {
  slots: Slot[];
  bookings: Booking[];
  holds: SlotHold[];
  secondDayOpen: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __flashEventStore: StoreState | undefined;
}

function createStore(): StoreState {
  return {
    slots: buildSlotCatalog(false).map((slot) => ({ ...slot })),
    bookings: [],
    holds: [],
    secondDayOpen: false,
  };
}

/** Old artist ids from before renames — keeps dev hot-reload state consistent. */
const LEGACY_ARTIST_IDS: Record<string, string> = {
  jake: "jeremy",
  sam: "keagan",
};

function migrateLegacyBooking(booking: Booking): void {
  const migratedArtistId = LEGACY_ARTIST_IDS[booking.artistId];
  if (migratedArtistId) {
    booking.artistId = migratedArtistId;
  }
  booking.slotId = migrateLegacySlotId(booking.slotId);
  if (!booking.acknowledgements) {
    booking.acknowledgements = {
      confirmPackPull: true,
      confirmArtistApproval: true,
      confirmAgeAndId: true,
    };
  }
}

function expireHolds(store: StoreState, now = Date.now()): void {
  store.holds = store.holds.filter(
    (hold) => new Date(hold.expiresAt).getTime() > now,
  );
}

function isHoldActive(hold: SlotHold, now = Date.now()): boolean {
  return new Date(hold.expiresAt).getTime() > now;
}

/** Rebuild slot statuses from confirmed bookings and active holds. */
function syncSlotsWithCatalog(store: StoreState): void {
  for (const booking of store.bookings) {
    migrateLegacyBooking(booking);
  }

  expireHolds(store);

  const bookedSlotIds = new Set(store.bookings.map((booking) => booking.slotId));
  const heldSlotIds = new Set(store.holds.map((hold) => hold.slotId));

  store.slots = buildSlotCatalog(store.secondDayOpen).map((slot) => {
    if (bookedSlotIds.has(slot.id)) {
      return { ...slot, status: "booked" as const };
    }
    if (heldSlotIds.has(slot.id)) {
      return { ...slot, status: "held" as const };
    }
    return { ...slot, status: "available" as const };
  });
}

function getStore(): StoreState {
  if (!globalThis.__flashEventStore) {
    globalThis.__flashEventStore = createStore();
  }
  if (!globalThis.__flashEventStore.holds) {
    globalThis.__flashEventStore.holds = [];
  }
  if (globalThis.__flashEventStore.secondDayOpen === undefined) {
    globalThis.__flashEventStore.secondDayOpen = false;
  }
  syncSlotsWithCatalog(globalThis.__flashEventStore);
  return globalThis.__flashEventStore;
}

function generateId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getAllArtists() {
  return ARTISTS;
}

export function isSecondDayOpen(): boolean {
  return getStore().secondDayOpen;
}

export function setSecondDayOpen(open: boolean): void {
  const store = getStore();
  store.secondDayOpen = open;
  syncSlotsWithCatalog(store);
}

export function getOpenEventDays() {
  return EVENT_DAYS.filter(
    (day) => !day.requiresSecondDayOpen || getStore().secondDayOpen,
  );
}

export function getSlots(): Slot[] {
  return getStore().slots;
}

export function getSlotsByArtistId(
  artistId: string,
  eventDate?: string,
): Slot[] {
  return getStore().slots.filter(
    (slot) =>
      slot.artistId === artistId &&
      (eventDate ? slot.eventDate === eventDate : true),
  );
}

export function getAvailableSlotCount(artistId: string): number {
  return getSlotsByArtistId(artistId).filter((s) => s.status === "available")
    .length;
}

export function getBookingById(id: string): Booking | undefined {
  return getStore().bookings.find((booking) => booking.id === id);
}

export function getAllBookings(): Booking[] {
  return [...getStore().bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getActiveHoldForSession(
  sessionId: string,
  slotId: string,
): SlotHold | undefined {
  const store = getStore();
  return store.holds.find(
    (hold) =>
      hold.sessionId === sessionId &&
      hold.slotId === slotId &&
      isHoldActive(hold),
  );
}

export function claimSlotHold(
  sessionId: string,
  artistId: string,
  slotId: string,
): ClaimSlotHoldResult {
  const store = getStore();
  const slot = getSlotById(slotId, store.slots);

  if (!slot || slot.artistId !== artistId) {
    return { success: false, error: "Time slot not found for this artist." };
  }

  const dayConfig = EVENT_DAYS.find((day) => day.id === slot.eventDate);
  if (dayConfig?.requiresSecondDayOpen && !store.secondDayOpen) {
    return { success: false, error: "This event day is not open for booking yet." };
  }

  if (slot.status === "booked") {
    return {
      success: false,
      error: "This time slot was just booked. Please choose another.",
    };
  }

  const now = Date.now();
  expireHolds(store, now);

  const existingHold = store.holds.find((hold) => hold.slotId === slotId);

  if (
    existingHold &&
    existingHold.sessionId !== sessionId &&
    isHoldActive(existingHold, now)
  ) {
    return {
      success: false,
      error: "Someone else is booking this slot. Please choose another time.",
    };
  }

  store.holds = store.holds.filter(
    (hold) => hold.sessionId !== sessionId || hold.slotId === slotId,
  );

  const expiresAt = new Date(now + SLOT_HOLD_MS).toISOString();

  if (existingHold?.sessionId === sessionId) {
    existingHold.expiresAt = expiresAt;
  } else {
    store.holds.push({ slotId, artistId, sessionId, expiresAt });
  }

  syncSlotsWithCatalog(store);
  return { success: true, expiresAt };
}

export function releaseSlotHold(sessionId: string, slotId: string): void {
  const store = getStore();
  store.holds = store.holds.filter(
    (hold) => !(hold.sessionId === sessionId && hold.slotId === slotId),
  );
  syncSlotsWithCatalog(store);
}

export function createBooking(
  sessionId: string,
  formData: Partial<BookingFormData>,
): CreateBookingResult {
  const errors = validateBookingForm(formData);
  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0] ?? "Invalid booking data.";
    return { success: false, error: firstError };
  }

  const data = formData as BookingFormData;

  if (!isValidPlacement(data.placement)) {
    return { success: false, error: "Invalid placement selection." };
  }

  if (!isValidColorPreference(data.colorPreference)) {
    return { success: false, error: "Invalid color preference." };
  }

  const artist = getArtistById(data.artistId);
  if (!artist) {
    return { success: false, error: "Artist not found." };
  }

  const store = getStore();
  const slot = getSlotById(data.slotId, store.slots);

  if (!slot || slot.artistId !== data.artistId) {
    return { success: false, error: "Time slot not found for this artist." };
  }

  if (slot.status === "booked") {
    return {
      success: false,
      error:
        "This time slot was just booked by someone else. Please choose another slot.",
    };
  }

  const hold = getActiveHoldForSession(sessionId, data.slotId);
  if (!hold) {
    return {
      success: false,
      error:
        "Your reservation expired. Please go back and select your time slot again.",
    };
  }

  const booking: Booking = {
    id: generateId(),
    artistId: data.artistId,
    slotId: data.slotId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    placement: data.placement,
    colorPreference: data.colorPreference,
    status: "Confirmed",
    acknowledgements: {
      confirmPackPull: data.confirmPackPull,
      confirmArtistApproval: data.confirmArtistApproval,
      confirmAgeAndId: data.confirmAgeAndId,
    },
    aiSummary: "",
    createdAt: new Date().toISOString(),
  };

  booking.aiSummary = generateBookingSummary(booking, artist, slot);

  store.bookings.push(booking);
  store.holds = store.holds.filter((h) => h.slotId !== data.slotId);
  syncSlotsWithCatalog(store);

  return { success: true, booking };
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): boolean {
  const store = getStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return false;

  booking.status = status;

  const artist = getArtistById(booking.artistId);
  const slot = getSlotById(booking.slotId, store.slots);
  if (artist && slot) {
    booking.aiSummary = generateBookingSummary(booking, artist, slot);
  }

  return true;
}
