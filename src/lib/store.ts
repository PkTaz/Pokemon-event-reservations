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
import { isDatabaseEnabled } from "./db/client";
import * as db from "./db/repository";
import {
  isValidColorPreference,
  isValidPlacement,
  validateBookingForm,
} from "./validation";
import type {
  AdminBookingInput,
  Booking,
  BookingFormData,
  BookingStatus,
  ClaimSlotHoldResult,
  CreateBookingResult,
  Slot,
  SlotHold,
} from "./types";

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

function createEmptyState(): StoreState {
  return {
    slots: buildSlotCatalog(false).map((slot) => ({ ...slot })),
    bookings: [],
    holds: [],
    secondDayOpen: false,
  };
}

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

function getMemoryStore(): StoreState {
  if (!globalThis.__flashEventStore) {
    globalThis.__flashEventStore = createEmptyState();
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

async function loadStoreState(): Promise<StoreState> {
  if (!isDatabaseEnabled()) {
    return getMemoryStore();
  }

  const [bookings, holds, secondDayOpen] = await Promise.all([
    db.fetchAllBookings(),
    db.fetchActiveHolds(),
    db.isSecondDayOpenInDb(),
  ]);

  for (const booking of bookings) {
    migrateLegacyBooking(booking);
  }

  const store: StoreState = {
    slots: [],
    bookings,
    holds,
    secondDayOpen,
  };
  syncSlotsWithCatalog(store);
  return store;
}

async function withMemoryStore<T>(
  fn: (store: StoreState) => T | Promise<T>,
): Promise<T> {
  const store = getMemoryStore();
  const result = await fn(store);
  syncSlotsWithCatalog(store);
  return result;
}

function generateId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getAllArtists() {
  return ARTISTS;
}

export async function getArtistsWithAvailability() {
  return Promise.all(
    ARTISTS.map(async (artist) => ({
      ...artist,
      spotsRemaining: await getAvailableSlotCount(artist.id),
    })),
  );
}

export async function isSecondDayOpen(): Promise<boolean> {
  if (isDatabaseEnabled()) {
    return db.isSecondDayOpenInDb();
  }
  return getMemoryStore().secondDayOpen;
}

export async function setSecondDayOpen(open: boolean): Promise<void> {
  if (isDatabaseEnabled()) {
    await db.setSecondDayOpenInDb(open);
    return;
  }

  await withMemoryStore((store) => {
    store.secondDayOpen = open;
  });
}

export async function getOpenEventDays() {
  const secondDayOpen = await isSecondDayOpen();
  return EVENT_DAYS.filter(
    (day) => !day.requiresSecondDayOpen || secondDayOpen,
  );
}

export async function getSlots(): Promise<Slot[]> {
  const store = await loadStoreState();
  return store.slots;
}

export async function getSlotsByArtistId(
  artistId: string,
  eventDate?: string,
): Promise<Slot[]> {
  const store = await loadStoreState();
  return store.slots.filter(
    (slot) =>
      slot.artistId === artistId &&
      (eventDate ? slot.eventDate === eventDate : true),
  );
}

export async function getAvailableSlotCount(artistId: string): Promise<number> {
  const slots = await getSlotsByArtistId(artistId);
  return slots.filter((s) => s.status === "available").length;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  if (isDatabaseEnabled()) {
    const booking = await db.fetchBookingById(id);
    if (booking) {
      migrateLegacyBooking(booking);
    }
    return booking;
  }

  const store = getMemoryStore();
  return store.bookings.find((booking) => booking.id === id);
}

export async function getAllBookings(): Promise<Booking[]> {
  if (isDatabaseEnabled()) {
    const bookings = await db.fetchAllBookings();
    for (const booking of bookings) {
      migrateLegacyBooking(booking);
    }
    return bookings;
  }

  const store = getMemoryStore();
  return [...store.bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function claimSlotHold(
  sessionId: string,
  artistId: string,
  slotId: string,
): Promise<ClaimSlotHoldResult> {
  const secondDayOpen = await isSecondDayOpen();
  const slots = await getSlots();
  const slot = getSlotById(slotId, slots);

  if (!slot || slot.artistId !== artistId) {
    return { success: false, error: "Time slot not found for this artist." };
  }

  const dayConfig = EVENT_DAYS.find((day) => day.id === slot.eventDate);
  if (dayConfig?.requiresSecondDayOpen && !secondDayOpen) {
    return {
      success: false,
      error: "This event day is not open for booking yet.",
    };
  }

  if (slot.status === "booked") {
    return {
      success: false,
      error: "This time slot was just booked. Please choose another.",
    };
  }

  const now = Date.now();
  const expiresAt = new Date(now + SLOT_HOLD_MS).toISOString();

  if (isDatabaseEnabled()) {
    const existingHold = await db.fetchHoldBySlotId(slotId);
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

    if (await db.isSlotBooked(slotId)) {
      return {
        success: false,
        error: "This time slot was just booked. Please choose another.",
      };
    }

    await db.upsertHold({ slotId, artistId, sessionId, expiresAt });
    await db.deleteHoldsForSessionExceptSlot(sessionId, slotId);
    return { success: true, expiresAt };
  }

  return withMemoryStore((store) => {
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

    if (existingHold?.sessionId === sessionId) {
      existingHold.expiresAt = expiresAt;
    } else {
      store.holds.push({ slotId, artistId, sessionId, expiresAt });
    }

    return { success: true, expiresAt };
  });
}

export async function releaseSlotHold(
  sessionId: string,
  slotId: string,
): Promise<void> {
  if (isDatabaseEnabled()) {
    await db.deleteHold(sessionId, slotId);
    return;
  }

  await withMemoryStore((store) => {
    store.holds = store.holds.filter(
      (hold) => !(hold.sessionId === sessionId && hold.slotId === slotId),
    );
  });
}

export async function createBooking(
  sessionId: string,
  formData: Partial<BookingFormData>,
): Promise<CreateBookingResult> {
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

  const slots = await getSlots();
  const slot = getSlotById(data.slotId, slots);

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

  if (isDatabaseEnabled()) {
    const hold = await db.fetchHoldForSession(sessionId, data.slotId);
    if (!hold || !isHoldActive(hold)) {
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

    const inserted = await db.insertBooking(booking);
    if (!inserted) {
      return {
        success: false,
        error:
          "This time slot was just booked by someone else. Please choose another slot.",
      };
    }

    await db.deleteHoldForSlot(data.slotId);
    return { success: true, booking };
  }

  return withMemoryStore((store) => {
    const memorySlot = getSlotById(data.slotId, store.slots);

    if (!memorySlot || memorySlot.artistId !== data.artistId) {
      return { success: false, error: "Time slot not found for this artist." };
    }

    if (memorySlot.status === "booked") {
      return {
        success: false,
        error:
          "This time slot was just booked by someone else. Please choose another slot.",
      };
    }

    const hold = store.holds.find(
      (item) =>
        item.sessionId === sessionId &&
        item.slotId === data.slotId &&
        isHoldActive(item),
    );

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

    booking.aiSummary = generateBookingSummary(booking, artist, memorySlot);

    store.bookings.push(booking);
    store.holds = store.holds.filter((h) => h.slotId !== data.slotId);

    return { success: true, booking };
  });
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<boolean> {
  if (isDatabaseEnabled()) {
    const booking = await db.fetchBookingById(bookingId);
    if (!booking) return false;

    booking.status = status;
    const artist = getArtistById(booking.artistId);
    const slots = await getSlots();
    const slot = getSlotById(booking.slotId, slots);
    const aiSummary =
      artist && slot
        ? generateBookingSummary(booking, artist, slot)
        : booking.aiSummary;

    return db.updateBookingStatusInDb(bookingId, status, aiSummary);
  }

  return withMemoryStore((store) => {
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    booking.status = status;

    const artist = getArtistById(booking.artistId);
    const slot = getSlotById(booking.slotId, store.slots);
    if (artist && slot) {
      booking.aiSummary = generateBookingSummary(booking, artist, slot);
    }

    return true;
  });
}

export async function resetAllEventData(): Promise<void> {
  if (isDatabaseEnabled()) {
    await db.resetEventDataInDb();
    return;
  }

  await withMemoryStore((store) => {
    store.bookings = [];
    store.holds = [];
    store.secondDayOpen = false;
  });
}

/** Staff-only: add a booking without going through the public hold flow. */
export async function createAdminBooking(
  input: AdminBookingInput,
): Promise<CreateBookingResult> {
  const artist = getArtistById(input.artistId);
  if (!artist) {
    return { success: false, error: "Artist not found." };
  }

  if (!isValidPlacement(input.placement)) {
    return { success: false, error: "Invalid placement." };
  }

  if (!isValidColorPreference(input.colorPreference)) {
    return { success: false, error: "Invalid color preference." };
  }

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();

  if (!name || !phone || !email) {
    return { success: false, error: "Name, phone, and email are required." };
  }

  const slots = await getSlots();
  const slot = getSlotById(input.slotId, slots);

  if (!slot || slot.artistId !== input.artistId) {
    return { success: false, error: "Time slot not found for this artist." };
  }

  if (slot.status === "booked") {
    return {
      success: false,
      error: "This slot is already booked. Pick another time.",
    };
  }

  const booking: Booking = {
    id: generateId(),
    artistId: input.artistId,
    slotId: input.slotId,
    name,
    phone,
    email,
    placement: input.placement,
    colorPreference: input.colorPreference,
    status: "Confirmed",
    acknowledgements: {
      confirmPackPull: true,
      confirmArtistApproval: true,
      confirmAgeAndId: true,
    },
    aiSummary: "",
    createdAt: new Date().toISOString(),
  };

  booking.aiSummary = generateBookingSummary(booking, artist, slot);

  if (isDatabaseEnabled()) {
    const inserted = await db.insertBooking(booking);
    if (!inserted) {
      return {
        success: false,
        error: "This slot is already booked. Pick another time.",
      };
    }

    await db.deleteHoldForSlot(input.slotId);
    return { success: true, booking };
  }

  return withMemoryStore((store) => {
    const memorySlot = getSlotById(input.slotId, store.slots);

    if (!memorySlot || memorySlot.artistId !== input.artistId) {
      return { success: false, error: "Time slot not found for this artist." };
    }

    if (memorySlot.status === "booked") {
      return {
        success: false,
        error: "This slot is already booked. Pick another time.",
      };
    }

    store.bookings.push(booking);
    store.holds = store.holds.filter((hold) => hold.slotId !== input.slotId);

    return { success: true, booking };
  });
}
