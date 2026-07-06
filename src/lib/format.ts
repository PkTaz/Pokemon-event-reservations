import { PLACEMENT_OPTIONS } from "./constants";
import type { ColorPreference, Placement } from "./types";

/** Convert 24h "HH:MM" to display like "10:00 AM". */
export function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}–${formatTime(endTime)}`;
}

export function formatEventDate(eventDate: string): string {
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatSlotLabel(slot: {
  eventDate: string;
  startTime: string;
  endTime: string;
}): string {
  return `${formatEventDate(slot.eventDate)} · ${formatTimeRange(slot.startTime, slot.endTime)}`;
}

export function formatPlacement(placement: Placement): string {
  const option = PLACEMENT_OPTIONS.find((item) => item.value === placement);
  return option?.label ?? placement;
}

export function formatColorPreference(preference: ColorPreference): string {
  switch (preference) {
    case "color":
      return "Color";
    case "black_gray":
      return "Black & Grey";
    case "artist_recommendation":
      return "Artist Recommendation";
  }
}
