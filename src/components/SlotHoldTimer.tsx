"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { releaseActiveSlotHold } from "@/components/BookingHoldGate";
import { SLOT_HOLD_MINUTES } from "@/lib/constants";

interface SlotHoldTimerProps {
  expiresAt: string;
  artistId: string;
  slotId: string;
  eventDate?: string;
}

function getSecondsLeft(expiresAt: Date): number {
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

function slotsHref(artistId: string, eventDate?: string): string {
  const base = `/artists/${artistId}/slots`;
  return eventDate ? `${base}?day=${eventDate}` : base;
}

export function SlotHoldTimer({
  expiresAt,
  artistId,
  slotId,
  eventDate,
}: SlotHoldTimerProps) {
  const router = useRouter();
  const target = new Date(expiresAt);
  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let interval: ReturnType<typeof setInterval>;

    const tick = async () => {
      const next = getSecondsLeft(target);
      setSecondsLeft(next);

      if (next <= 0) {
        clearInterval(interval);
        await releaseActiveSlotHold(artistId, slotId);
        router.replace(slotsHref(artistId, eventDate));
        router.refresh();
      }
    };

    void tick();
    interval = setInterval(() => {
      void tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted, target, artistId, slotId, eventDate, router]);

  const minutes =
    secondsLeft !== null ? Math.floor(secondsLeft / 60) : SLOT_HOLD_MINUTES;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;

  return (
    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm">
      <p className="font-black text-amber-950">
        ⏳ This slot is held for you — complete booking within{" "}
        {mounted && secondsLeft !== null ? (
          <span className="tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        ) : (
          `${SLOT_HOLD_MINUTES}:00`
        )}
      </p>
      <p className="mt-1 font-semibold text-amber-900/80">
        Leave this page and the slot opens back up for others right away.
      </p>
    </div>
  );
}
