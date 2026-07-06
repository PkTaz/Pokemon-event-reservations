/** Standard flash day: 10:00 AM – 6:00 PM (last slot ends 5:30 PM). */
export const TIME_SLOT_TEMPLATES = [
  { startTime: "10:00", endTime: "11:30" },
  { startTime: "11:30", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:30" },
  { startTime: "14:30", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:30" },
] as const;

/** Jeremy on July 18 only: 12:00 PM – 8:00 PM (last slot ends 7:30 PM). */
export const JEREMY_JULY_18_SLOT_TEMPLATES = [
  { startTime: "12:00", endTime: "13:30" },
  { startTime: "13:30", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:30" },
  { startTime: "16:30", endTime: "18:00" },
  { startTime: "18:00", endTime: "19:30" },
] as const;

export const EVENT_DAY_1_ID = "2026-07-18";
export const EVENT_DAY_2_ID = "2026-07-19";

export interface EventDayConfig {
  id: string;
  label: string;
  displayLabel: string;
  /** Hidden until admin opens the second day. */
  requiresSecondDayOpen?: boolean;
}

export const EVENT_DAYS: EventDayConfig[] = [
  {
    id: EVENT_DAY_1_ID,
    label: "July 18",
    displayLabel: "Saturday, July 18",
  },
  {
    id: EVENT_DAY_2_ID,
    label: "July 19",
    displayLabel: "Sunday, July 19",
    requiresSecondDayOpen: true,
  },
];

export function getEventDayConfig(eventDate: string): EventDayConfig | undefined {
  return EVENT_DAYS.find((day) => day.id === eventDate);
}

export function getSlotTemplatesForArtist(
  artistId: string,
  eventDate: string,
): readonly { startTime: string; endTime: string }[] {
  if (artistId === "jeremy" && eventDate === EVENT_DAY_1_ID) {
    return JEREMY_JULY_18_SLOT_TEMPLATES;
  }
  return TIME_SLOT_TEMPLATES;
}
