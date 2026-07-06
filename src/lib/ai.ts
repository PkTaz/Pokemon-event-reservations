import {
  formatColorPreference,
  formatEventDate,
  formatPlacement,
  formatTimeRange,
} from "./format";
import type { Artist, Booking, Slot } from "./types";

/**
 * Placeholder for future OpenAI/Gemini integration.
 * Replace this implementation when API keys are configured.
 */
export function generateBookingSummary(
  booking: Booking,
  artist: Artist,
  slot: Slot,
): string {
  return `${booking.name} is booked with ${artist.name} on ${formatEventDate(slot.eventDate)} from ${formatTimeRange(slot.startTime, slot.endTime)}. Placement: ${formatPlacement(booking.placement)}. Preference: ${formatColorPreference(booking.colorPreference)}. ${booking.status} for Pokémon Flash Event.`;
}
