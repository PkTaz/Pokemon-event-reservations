"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetAllEventData } from "@/lib/actions/admin";

export function AdminResetDataButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    setMessage(null);
    setError(null);

    const confirmed = window.confirm(
      "Clear ALL test bookings, slot holds, and close Day 2?\n\nAll slots will become available again. This cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await resetAllEventData();
      if (!result.ok) {
        setError(result.error ?? "Could not reset data.");
        return;
      }
      setMessage("All bookings cleared. Every slot is available again.");
      router.refresh();
    });
  }

  return (
    <div className="poke-panel mb-6 border-poke-red/40 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="poke-title text-lg font-black text-poke-navy">
            Reset event data
          </h2>
          <p className="mt-1 text-sm font-semibold text-poke-navy/70">
            Remove all test bookings and active holds. Closes July 19 until you
            open it again.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="shrink-0 rounded-xl border-2 border-poke-red bg-red-50 px-4 py-2.5 text-sm font-black text-poke-red transition hover:bg-red-100 disabled:opacity-60"
        >
          {isPending ? "Clearing..." : "Clear all bookings"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-bold text-green-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm font-bold text-poke-red">{error}</p>
      ) : null}
    </div>
  );
}
