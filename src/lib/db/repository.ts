import type {
  Booking,
  BookingStatus,
  SlotHold,
} from "@/lib/types";
import { query, queryOne } from "./client";

interface BookingRow {
  id: string;
  artist_id: string;
  slot_id: string;
  name: string;
  phone: string;
  email: string;
  placement: Booking["placement"];
  color_preference: Booking["colorPreference"];
  status: BookingStatus;
  confirm_pack_pull: boolean;
  confirm_artist_approval: boolean;
  confirm_age_and_id: boolean;
  ai_summary: string;
  created_at: Date | string;
}

interface HoldRow {
  slot_id: string;
  artist_id: string;
  session_id: string;
  expires_at: Date | string;
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    artistId: row.artist_id,
    slotId: row.slot_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    placement: row.placement,
    colorPreference: row.color_preference,
    status: row.status,
    acknowledgements: {
      confirmPackPull: row.confirm_pack_pull,
      confirmArtistApproval: row.confirm_artist_approval,
      confirmAgeAndId: row.confirm_age_and_id,
    },
    aiSummary: row.ai_summary,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapHold(row: HoldRow): SlotHold {
  return {
    slotId: row.slot_id,
    artistId: row.artist_id,
    sessionId: row.session_id,
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export async function deleteExpiredHolds(): Promise<void> {
  await query("DELETE FROM slot_holds WHERE expires_at <= NOW()");
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const rows = await query<BookingRow>(
    "SELECT * FROM bookings ORDER BY created_at DESC",
  );
  return rows.map(mapBooking);
}

export async function fetchBookingById(id: string): Promise<Booking | undefined> {
  const row = await queryOne<BookingRow>(
    "SELECT * FROM bookings WHERE id = $1",
    [id],
  );
  return row ? mapBooking(row) : undefined;
}

export async function fetchActiveHolds(): Promise<SlotHold[]> {
  await deleteExpiredHolds();
  const rows = await query<HoldRow>(
    "SELECT * FROM slot_holds WHERE expires_at > NOW()",
  );
  return rows.map(mapHold);
}

export async function fetchHoldBySlotId(
  slotId: string,
): Promise<SlotHold | undefined> {
  await deleteExpiredHolds();
  const row = await queryOne<HoldRow>(
    "SELECT * FROM slot_holds WHERE slot_id = $1 AND expires_at > NOW()",
    [slotId],
  );
  return row ? mapHold(row) : undefined;
}

export async function fetchHoldForSession(
  sessionId: string,
  slotId: string,
): Promise<SlotHold | undefined> {
  await deleteExpiredHolds();
  const row = await queryOne<HoldRow>(
    "SELECT * FROM slot_holds WHERE session_id = $1 AND slot_id = $2 AND expires_at > NOW()",
    [sessionId, slotId],
  );
  return row ? mapHold(row) : undefined;
}

export async function isSecondDayOpenInDb(): Promise<boolean> {
  const row = await queryOne<{ value: boolean }>(
    "SELECT value FROM app_settings WHERE key = 'second_day_open'",
  );
  return Boolean(row?.value);
}

export async function setSecondDayOpenInDb(open: boolean): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value)
     VALUES ('second_day_open', to_jsonb($1::boolean))
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [open],
  );
}

export async function upsertHold(hold: SlotHold): Promise<void> {
  await query(
    `INSERT INTO slot_holds (slot_id, artist_id, session_id, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slot_id) DO UPDATE
     SET artist_id = EXCLUDED.artist_id,
         session_id = EXCLUDED.session_id,
         expires_at = EXCLUDED.expires_at`,
    [hold.slotId, hold.artistId, hold.sessionId, hold.expiresAt],
  );
}

export async function deleteHold(sessionId: string, slotId: string): Promise<void> {
  await query(
    "DELETE FROM slot_holds WHERE session_id = $1 AND slot_id = $2",
    [sessionId, slotId],
  );
}

export async function deleteHoldForSlot(slotId: string): Promise<void> {
  await query("DELETE FROM slot_holds WHERE slot_id = $1", [slotId]);
}

export async function deleteHoldsForSessionExceptSlot(
  sessionId: string,
  slotId: string,
): Promise<void> {
  await query(
    "DELETE FROM slot_holds WHERE session_id = $1 AND slot_id <> $2",
    [sessionId, slotId],
  );
}

export async function insertBooking(booking: Booking): Promise<boolean> {
  const result = await query<{ id: string }>(
    `INSERT INTO bookings (
      id, artist_id, slot_id, name, phone, email, placement, color_preference,
      status, confirm_pack_pull, confirm_artist_approval, confirm_age_and_id,
      ai_summary, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, $14
    )
    ON CONFLICT (slot_id) DO NOTHING
    RETURNING id`,
    [
      booking.id,
      booking.artistId,
      booking.slotId,
      booking.name,
      booking.phone,
      booking.email,
      booking.placement,
      booking.colorPreference,
      booking.status,
      booking.acknowledgements.confirmPackPull,
      booking.acknowledgements.confirmArtistApproval,
      booking.acknowledgements.confirmAgeAndId,
      booking.aiSummary,
      booking.createdAt,
    ],
  );
  return result.length > 0;
}

export async function updateBookingStatusInDb(
  bookingId: string,
  status: BookingStatus,
  aiSummary: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE bookings
     SET status = $2, ai_summary = $3
     WHERE id = $1
     RETURNING id`,
    [bookingId, status, aiSummary],
  );
  return rows.length > 0;
}

export async function resetEventDataInDb(): Promise<void> {
  await query("DELETE FROM bookings");
  await query("DELETE FROM slot_holds");
  await setSecondDayOpenInDb(false);
}

export async function isSlotBooked(slotId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM bookings WHERE slot_id = $1",
    [slotId],
  );
  return Boolean(row);
}

export async function deleteBookingInDb(bookingId: string): Promise<boolean> {
  const rows = await query<{ slot_id: string }>(
    "DELETE FROM bookings WHERE id = $1 RETURNING slot_id",
    [bookingId],
  );

  if (rows.length === 0) {
    return false;
  }

  await deleteHoldForSlot(rows[0]!.slot_id);
  return true;
}
