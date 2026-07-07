"use server";

import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/actions/booking";
import { getDatabaseDiagnostics } from "@/lib/db/client";
import {
  createAdminBooking as createAdminBookingInStore,
  getAllBookings,
  getSlots,
  isSecondDayOpen,
  resetAllEventData as resetAllEventDataInStore,
  setSecondDayOpen,
  updateBookingStatus,
  deleteBooking as deleteBookingInStore,
} from "@/lib/store";
import { getArtistById } from "@/lib/data/artists";
import { getSlotById } from "@/lib/data/slots";
import type { AdminBookingInput, BookingStatus } from "@/lib/types";
import { formatSlotLabel } from "@/lib/format";

export async function fetchAdminBookings() {
  const authed = await isAdminAuthenticated();
  if (!authed) return null;

  const slots = await getSlots();
  const bookings = await getAllBookings();
  return bookings.map((booking) => {
    const artist = getArtistById(booking.artistId);
    const slot = getSlotById(booking.slotId, slots);
    return {
      ...booking,
      artistName: artist?.name ?? "Unknown",
      timeLabel: slot ? formatSlotLabel(slot) : "Unknown",
    };
  });
}

export async function fetchSecondDayStatus() {
  const authed = await isAdminAuthenticated();
  if (!authed) return null;
  return { open: await isSecondDayOpen() };
}

export async function toggleSecondDayOpen(): Promise<{
  ok: boolean;
  open: boolean;
  error?: string;
}> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, open: false, error: "Unauthorized" };
  }

  const next = !(await isSecondDayOpen());
  await setSecondDayOpen(next);
  return { ok: true, open: next };
}

export async function changeBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, error: "Unauthorized" };
  }

  const updated = await updateBookingStatus(bookingId, status);
  return updated ? { ok: true } : { ok: false, error: "Booking not found" };
}

export async function deleteAdminBooking(
  bookingId: string,
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, error: "Unauthorized" };
  }

  const deleted = await deleteBookingInStore(bookingId);
  return deleted ? { ok: true } : { ok: false, error: "Booking not found" };
}

export async function resetAllEventData(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, error: "Unauthorized" };
  }

  await resetAllEventDataInStore();
  return { ok: true };
}

export async function fetchDatabaseStatus() {
  const authed = await isAdminAuthenticated();
  if (!authed) return null;

  return getDatabaseDiagnostics();
}

export async function addAdminBooking(
  input: AdminBookingInput,
): Promise<{ ok: boolean; error?: string; bookingId?: string }> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, error: "Unauthorized" };
  }

  const result = await createAdminBookingInStore(input);
  if (!result.success) {
    return { ok: false, error: result.error };
  }

  return { ok: true, bookingId: result.booking.id };
}

export async function fetchAdminSlotOptions() {
  const authed = await isAdminAuthenticated();
  if (!authed) return null;

  const slots = await getSlots();
  return slots
    .filter((slot) => slot.status !== "booked")
    .map((slot) => {
      const artist = getArtistById(slot.artistId);
      return {
        id: slot.id,
        artistId: slot.artistId,
        label: formatSlotLabel(slot),
        artistName: artist?.name ?? slot.artistId,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
}
