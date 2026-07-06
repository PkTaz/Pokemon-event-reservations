"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { claimSlotHold } from "@/lib/actions/booking";
import { formatTimeRange } from "@/lib/format";
import type { Slot } from "@/lib/types";

interface SlotPickerProps {
  artistId: string;
  artistName: string;
  slots: Slot[];
}

export function SlotPicker({ artistId, artistName, slots }: SlotPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refresh slot availability while this page is open.
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  function handleSelectSlot(slotId: string) {
    setError(null);
    setPendingSlotId(slotId);

    startTransition(async () => {
      const result = await claimSlotHold(artistId, slotId);

      if (!result.success) {
        setError(result.error);
        setPendingSlotId(null);
        router.refresh();
        return;
      }

      router.push(`/book?artistId=${artistId}&slotId=${slotId}`);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-black text-poke-navy">
        Trainer <span className="text-poke-blue">{artistName}</span> — pick your
        battle window
      </p>

      {error ? (
        <div className="rounded-xl border-2 border-poke-red bg-red-50 px-4 py-3 text-sm font-bold text-poke-red">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        {slots.map((slot, index) => {
          const unavailable = slot.status !== "available";
          const label = formatTimeRange(slot.startTime, slot.endTime);
          const isLoading = isPending && pendingSlotId === slot.id;

          if (unavailable) {
            const statusLabel =
              slot.status === "booked" ? "Fainted" : "Held";

            return (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-xl border-2 border-dashed border-poke-navy/30 bg-zinc-100/80 px-4 py-3 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-poke-navy/30 bg-zinc-200 text-xs font-black text-zinc-400">
                    {index + 1}
                  </span>
                  <span className="font-bold text-zinc-400 line-through">
                    {label}
                  </span>
                </div>
                <span className="rounded-full border-2 border-zinc-400 bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-500">
                  {statusLabel}
                </span>
              </div>
            );
          }

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isPending}
              onClick={() => handleSelectSlot(slot.id)}
              className="group flex items-center justify-between rounded-xl border-2 border-poke-navy bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--poke-navy)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-poke-navy bg-poke-yellow text-xs font-black text-poke-navy">
                  {index + 1}
                </span>
                <span className="font-black text-poke-navy">{label}</span>
              </div>
              <span className="rounded-full border-2 border-green-700 bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-800">
                {isLoading ? "..." : "Ready"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
