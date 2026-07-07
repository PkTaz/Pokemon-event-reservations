import type { Booking, SlotHold } from "./types";

export interface PersistedEventState {
  bookings: Booking[];
  holds: SlotHold[];
  secondDayOpen: boolean;
}

const BLOB_STORE_NAME = "pokemon-event-reservations";
const STATE_KEY = "event-state";

export function isNetlifyPersistenceEnabled(): boolean {
  return process.env["NETLIFY"] === "true";
}

export async function loadPersistedState(): Promise<PersistedEventState | null> {
  if (!isNetlifyPersistenceEnabled()) {
    return null;
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const blobStore = getStore(BLOB_STORE_NAME);
    const data = await blobStore.get(STATE_KEY, { type: "json" });
    if (!data || typeof data !== "object") {
      return null;
    }

    const state = data as PersistedEventState;
    return {
      bookings: Array.isArray(state.bookings) ? state.bookings : [],
      holds: Array.isArray(state.holds) ? state.holds : [],
      secondDayOpen: Boolean(state.secondDayOpen),
    };
  } catch (error) {
    console.error("Failed to load persisted event state:", error);
    return null;
  }
}

export async function savePersistedState(state: PersistedEventState): Promise<void> {
  if (!isNetlifyPersistenceEnabled()) {
    return;
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const blobStore = getStore(BLOB_STORE_NAME);
    await blobStore.setJSON(STATE_KEY, state);
  } catch (error) {
    console.error("Failed to save persisted event state:", error);
    throw error;
  }
}

export function mergePersistedStates(
  ...states: PersistedEventState[]
): PersistedEventState {
  const bookingsById = new Map<string, Booking>();
  const holdsBySlot = new Map<string, SlotHold>();
  let secondDayOpen = false;
  const now = Date.now();

  for (const state of states) {
    secondDayOpen = secondDayOpen || state.secondDayOpen;

    for (const booking of state.bookings) {
      bookingsById.set(booking.id, booking);
    }

    for (const hold of state.holds) {
      if (new Date(hold.expiresAt).getTime() <= now) continue;

      const existing = holdsBySlot.get(hold.slotId);
      if (
        !existing ||
        new Date(hold.expiresAt).getTime() >
          new Date(existing.expiresAt).getTime()
      ) {
        holdsBySlot.set(hold.slotId, hold);
      }
    }
  }

  return {
    bookings: [...bookingsById.values()],
    holds: [...holdsBySlot.values()],
    secondDayOpen,
  };
}

export function toPersistedState(state: {
  bookings: Booking[];
  holds: SlotHold[];
  secondDayOpen: boolean;
}): PersistedEventState {
  return {
    bookings: state.bookings,
    holds: state.holds,
    secondDayOpen: state.secondDayOpen,
  };
}
