"use server";

import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/actions/booking";
import {
  getAllBookings,
  getSlots,
  isSecondDayOpen,
  resetAllEventData as resetAllEventDataInStore,
  setSecondDayOpen,
  syncEventDataFromAllServers,
  updateBookingStatus,
} from "@/lib/store";
import { getArtistById } from "@/lib/data/artists";
import { getSlotById } from "@/lib/data/slots";
import type { BookingStatus } from "@/lib/types";
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

export async function syncAllBookings(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return { ok: false, count: 0, error: "Unauthorized" };
  }

  const count = await syncEventDataFromAllServers();
  return { ok: true, count };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
}
