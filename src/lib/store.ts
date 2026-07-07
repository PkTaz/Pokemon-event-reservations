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
import {
  loadPersistedState,
  mergePersistedStates,
  savePersistedState,
  toPersistedState,
} from "./persistence";
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

function setMemoryStore(store: StoreState): void {
  globalThis.__flashEventStore = store;
}

async function hydrateStore(): Promise<StoreState> {
  const memory = getMemoryStore();
  const persisted = await loadPersistedState();

  if (!persisted) {
    return memory;
  }

  const merged = mergePersistedStates(
    toPersistedState(memory),
    persisted,
  );

  const store: StoreState = {
    ...memory,
    bookings: merged.bookings,
    holds: merged.holds,
    secondDayOpen: merged.secondDayOpen,
  };

  syncSlotsWithCatalog(store);
  setMemoryStore(store);

  await savePersistedState(toPersistedState(store));
  return store;
}

async function commitStore(store: StoreState): Promise<void> {
  syncSlotsWithCatalog(store);
  setMemoryStore(store);
  await savePersistedState(toPersistedState(store));
}

async function withStore<T>(
  fn: (store: StoreState) => T | Promise<T>,
): Promise<T> {
  const store = await hydrateStore();
  const result = await fn(store);
  await commitStore(store);
  return result;
}

function generateId(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getAllArtists() {
  return ARTISTS;
}

export async function isSecondDayOpen(): Promise<boolean> {
  const store = await hydrateStore();
  return store.secondDayOpen;
}

export async function setSecondDayOpen(open: boolean): Promise<void> {
  await withStore((store) => {
    store.secondDayOpen = open;
  });
}

export async function getOpenEventDays() {
  const store = await hydrateStore();
  return EVENT_DAYS.filter(
    (day) => !day.requiresSecondDayOpen || store.secondDayOpen,
  );
}

export async function getSlots(): Promise<Slot[]> {
  const store = await hydrateStore();
  return store.slots;
}

export async function getSlotsByArtistId(
  artistId: string,
  eventDate?: string,
): Promise<Slot[]> {
  const store = await hydrateStore();
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
  const store = await hydrateStore();
  return store.bookings.find((booking) => booking.id === id);
}

export async function getAllBookings(): Promise<Booking[]> {
  const store = await hydrateStore();
  return [...store.bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function syncEventDataFromAllServers(): Promise<number> {
  const store = await hydrateStore();
  await commitStore(store);
  return store.bookings.length;
}

export async function claimSlotHold(
  sessionId: string,
  artistId: string,
  slotId: string,
): Promise<ClaimSlotHoldResult> {
  return withStore((store) => {
    const slot = getSlotById(slotId, store.slots);

    if (!slot || slot.artistId !== artistId) {
      return { success: false, error: "Time slot not found for this artist." };
    }

    const dayConfig = EVENT_DAYS.find((day) => day.id === slot.eventDate);
    if (dayConfig?.requiresSecondDayOpen && !store.secondDayOpen) {
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

    return { success: true, expiresAt };
  });
}

export async function releaseSlotHold(
  sessionId: string,
  slotId: string,
): Promise<void> {
  await withStore((store) => {
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

  return withStore((store) => {
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

    booking.aiSummary = generateBookingSummary(booking, artist, slot);

    store.bookings.push(booking);
    store.holds = store.holds.filter((h) => h.slotId !== data.slotId);

    return { success: true, booking };
  });
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<boolean> {
  return withStore((store) => {
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
  await withStore((store) => {
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

  return withStore((store) => {
    const slot = getSlotById(input.slotId, store.slots);

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
    store.bookings.push(booking);
    store.holds = store.holds.filter((hold) => hold.slotId !== input.slotId);

    return { success: true, booking };
  });
}
