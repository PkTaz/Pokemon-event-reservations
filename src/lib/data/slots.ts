import {
  EVENT_DAYS,
  getSlotTemplatesForArtist,
} from "./event-days";
import type { Slot } from "../types";
import { ARTISTS } from "./artists";

function buildSlotId(
  artistId: string,
  eventDate: string,
  startTime: string,
): string {
  const dateKey = eventDate.replace(/-/g, "");
  const timeKey = startTime.replace(":", "");
  return `${artistId}-${dateKey}-${timeKey}`;
}

export function buildSlotCatalog(secondDayOpen: boolean): Slot[] {
  const slots: Slot[] = [];

  for (const day of EVENT_DAYS) {
    if (day.requiresSecondDayOpen && !secondDayOpen) {
      continue;
    }

    for (const artist of ARTISTS) {
      const templates = getSlotTemplatesForArtist(artist.id, day.id);

      for (const template of templates) {
        slots.push({
          id: buildSlotId(artist.id, day.id, template.startTime),
          artistId: artist.id,
          eventDate: day.id,
          startTime: template.startTime,
          endTime: template.endTime,
          status: "available",
        });
      }
    }
  }

  return slots;
}

/** @deprecated Use buildSlotCatalog — kept for type re-exports during migration. */
export const INITIAL_SLOTS = buildSlotCatalog(false);

export function getSlotById(id: string, slots: Slot[]): Slot | undefined {
  return slots.find((slot) => slot.id === id);
}

export function getSlotsForArtist(
  artistId: string,
  slots: Slot[],
  eventDate?: string,
): Slot[] {
  return slots.filter(
    (slot) =>
      slot.artistId === artistId &&
      (eventDate ? slot.eventDate === eventDate : true),
  );
}

/** Map legacy single-day slot ids to July 18 ids. */
export function migrateLegacySlotId(slotId: string): string {
  const legacyMatch = slotId.match(/^(madi|jeremy|keagan|jake|sam)-(\d{4})$/);
  if (!legacyMatch) return slotId;

  const artistId =
    legacyMatch[1] === "jake"
      ? "jeremy"
      : legacyMatch[1] === "sam"
        ? "keagan"
        : legacyMatch[1];

  return buildSlotId(artistId, "2026-07-18", `${legacyMatch[2].slice(0, 2)}:${legacyMatch[2].slice(2)}`);
}
