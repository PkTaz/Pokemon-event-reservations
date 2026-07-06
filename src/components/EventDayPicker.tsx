import Link from "next/link";
import type { EventDayConfig } from "@/lib/data/event-days";

interface EventDayPickerProps {
  days: EventDayConfig[];
  artistId: string;
  selectedDayId: string;
}

export function EventDayPicker({
  days,
  artistId,
  selectedDayId,
}: EventDayPickerProps) {
  if (days.length <= 1) {
    const day = days[0];
    if (!day) return null;

    return (
      <div className="poke-panel-inset mb-6 p-4 text-center">
        <p className="text-xs font-black uppercase tracking-wider text-poke-navy/60">
          Event day
        </p>
        <p className="mt-1 text-sm font-black text-poke-navy">
          {day.displayLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="mb-3 text-center text-xs font-black uppercase tracking-wider text-poke-navy/60">
        Choose event day
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {days.map((day) => {
          const selected = day.id === selectedDayId;
          return (
            <Link
              key={day.id}
              href={`/artists/${artistId}/slots?day=${day.id}`}
              className={`rounded-xl border-2 px-4 py-3 text-center transition ${
                selected
                  ? "border-poke-navy bg-poke-yellow shadow-[0_3px_0_var(--poke-navy)]"
                  : "border-poke-navy/30 bg-white hover:border-poke-navy"
              }`}
            >
              <p className="text-sm font-black text-poke-navy">
                {day.displayLabel}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
