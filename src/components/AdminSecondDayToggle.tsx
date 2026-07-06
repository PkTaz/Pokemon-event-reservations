"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleSecondDayOpen } from "@/lib/actions/admin";
import { EVENT_DAY_2_ID } from "@/lib/data/event-days";
import { getEventDayConfig } from "@/lib/data/event-days";

interface AdminSecondDayToggleProps {
  initiallyOpen: boolean;
}

export function AdminSecondDayToggle({
  initiallyOpen,
}: AdminSecondDayToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const day2 = getEventDayConfig(EVENT_DAY_2_ID);

  function handleToggle() {
    startTransition(async () => {
      await toggleSecondDayOpen();
      router.refresh();
    });
  }

  return (
    <div className="poke-panel mb-6 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="poke-title text-lg font-black text-poke-navy">
            Second event day
          </h2>
          <p className="mt-1 text-sm font-semibold text-poke-navy/70">
            {initiallyOpen
              ? `${day2?.displayLabel ?? "July 19"} is open — customers can book Day 2 slots.`
              : `Open ${day2?.displayLabel ?? "July 19"} so customers can book a second day of appointments.`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={
            initiallyOpen
              ? "poke-btn-secondary px-4 py-2.5 text-sm disabled:opacity-60"
              : "poke-btn px-4 py-2.5 text-sm disabled:opacity-60"
          }
        >
          {isPending
            ? "Updating..."
            : initiallyOpen
              ? "Close second day"
              : "Open second day"}
        </button>
      </div>
    </div>
  );
}
