import type { Booking, SlotHold } from "./types";

export interface PersistedEventState {
  bookings: Booking[];
  holds: SlotHold[];
  secondDayOpen: boolean;
}

export interface PersistenceDiagnostics {
  enabled: boolean;
  loaded: boolean;
  bookingCount: number;
  error?: string;
  mode: "production-blobs" | "local-memory";
}

const BLOB_STORE_NAME = "pokemon-event-reservations";
const LEGACY_STATE_KEY = "event-state";
const META_KEY = "event-meta";
const BOOKING_PREFIX = "booking/";

let lastDiagnostics: PersistenceDiagnostics = {
  enabled: false,
  loaded: false,
  bookingCount: 0,
  mode: "local-memory",
};

export function getPersistenceDiagnostics(): PersistenceDiagnostics {
  return lastDiagnostics;
}

/** In production we always attempt Netlify Blobs (runtime provides context). */
export function shouldUseNetlifyBlobs(): boolean {
  if (process.env["DISABLE_NETLIFY_BLOBS"] === "true") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore(BLOB_STORE_NAME);
}

export async function loadPersistedState(): Promise<PersistedEventState | null> {
  if (!shouldUseNetlifyBlobs()) {
    lastDiagnostics = {
      enabled: false,
      loaded: false,
      bookingCount: 0,
      mode: "local-memory",
    };
    return null;
  }

  try {
    const blobStore = await getBlobStore();
    const bookingsById = new Map<string, Booking>();

    // Legacy single-file state (from first deploy)
    const legacy = await blobStore.get(LEGACY_STATE_KEY, { type: "json" });
    if (legacy && typeof legacy === "object") {
      const state = legacy as PersistedEventState;
      for (const booking of state.bookings ?? []) {
        if (booking?.id) bookingsById.set(booking.id, booking);
      }
    }

    // Per-booking keys (durable storage)
    const listing = await blobStore.list({ prefix: BOOKING_PREFIX });
    for (const entry of listing.blobs) {
      const booking = await blobStore.get(entry.key, { type: "json" });
      if (booking && typeof booking === "object" && "id" in booking) {
        bookingsById.set((booking as Booking).id, booking as Booking);
      }
    }

    const meta =
      ((await blobStore.get(META_KEY, { type: "json" })) as {
        holds?: SlotHold[];
        secondDayOpen?: boolean;
      } | null) ??
      (legacy && typeof legacy === "object"
        ? (legacy as PersistedEventState)
        : null);

    const state: PersistedEventState = {
      bookings: [...bookingsById.values()],
      holds: Array.isArray(meta?.holds) ? meta!.holds! : [],
      secondDayOpen: Boolean(meta?.secondDayOpen),
    };

    lastDiagnostics = {
      enabled: true,
      loaded: true,
      bookingCount: state.bookings.length,
      mode: "production-blobs",
    };

    return state;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to load persisted event state:", error);
    lastDiagnostics = {
      enabled: true,
      loaded: false,
      bookingCount: 0,
      error: message,
      mode: "production-blobs",
    };
    return null;
  }
}

export async function savePersistedState(state: PersistedEventState): Promise<void> {
  if (!shouldUseNetlifyBlobs()) {
    return;
  }

  try {
    const blobStore = await getBlobStore();

    await blobStore.setJSON(META_KEY, {
      holds: state.holds,
      secondDayOpen: state.secondDayOpen,
    });

    const bookingIds = new Set(state.bookings.map((booking) => booking.id));

    for (const booking of state.bookings) {
      await blobStore.setJSON(`${BOOKING_PREFIX}${booking.id}`, booking);
    }

    const listing = await blobStore.list({ prefix: BOOKING_PREFIX });
    for (const entry of listing.blobs) {
      const id = entry.key.slice(BOOKING_PREFIX.length);
      if (!bookingIds.has(id)) {
        await blobStore.delete(entry.key);
      }
    }

    await blobStore.setJSON(LEGACY_STATE_KEY, state);

    lastDiagnostics = {
      enabled: true,
      loaded: true,
      bookingCount: state.bookings.length,
      mode: "production-blobs",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to save persisted event state:", error);
    lastDiagnostics = {
      enabled: true,
      loaded: false,
      bookingCount: state.bookings.length,
      error: message,
      mode: "production-blobs",
    };
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
