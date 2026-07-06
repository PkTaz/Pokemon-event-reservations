"use server";

import { cookies } from "next/headers";
import {
  getAllArtists,
  getAvailableSlotCount,
  getBookingById,
  getOpenEventDays,
  getSlotsByArtistId,
  claimSlotHold as claimSlotHoldInStore,
  createBooking,
  releaseSlotHold as releaseSlotHoldInStore,
} from "@/lib/store";
import type { BookingFormData, ClaimSlotHoldResult, CreateBookingResult } from "@/lib/types";
import { getAdminPassword } from "@/lib/env";

const BOOKING_SESSION_COOKIE = "booking_session";

async function readBookingSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(BOOKING_SESSION_COOKIE)?.value;
}

async function ensureBookingSession(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(BOOKING_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(BOOKING_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return sessionId;
}

export async function claimSlotHold(
  artistId: string,
  slotId: string,
): Promise<ClaimSlotHoldResult> {
  const sessionId = await ensureBookingSession();
  return claimSlotHoldInStore(sessionId, artistId, slotId);
}

export async function releaseSlotHold(
  artistId: string,
  slotId: string,
): Promise<void> {
  const sessionId = await readBookingSessionId();
  if (!sessionId) return;
  releaseSlotHoldInStore(sessionId, slotId);
}

export async function fetchArtistsWithAvailability() {
  return getAllArtists().map((artist) => ({
    ...artist,
    spotsRemaining: getAvailableSlotCount(artist.id),
  }));
}

export async function fetchArtistSlots(artistId: string, eventDate?: string) {
  return getSlotsByArtistId(artistId, eventDate);
}

export async function fetchOpenEventDays() {
  return getOpenEventDays();
}

export async function submitBooking(
  formData: Partial<BookingFormData>,
): Promise<CreateBookingResult> {
  const sessionId = await ensureBookingSession();
  return createBooking(sessionId, formData);
}

export async function fetchBooking(bookingId: string) {
  return getBookingById(bookingId) ?? null;
}

export async function loginAdmin(password: string): Promise<{ ok: boolean }> {
  const expected = getAdminPassword();
  if (!expected) {
    console.error("ADMIN_PASSWORD is not set at runtime");
    return { ok: false };
  }
  if (password.trim() !== expected) {
    return { ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "1";
}
