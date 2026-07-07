"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncAllBookings } from "@/lib/actions/admin";

export function AdminSyncBookingsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSync() {
    setMessage(null);
    startTransition(async () => {
      const result = await syncAllBookings();
      if (!result.ok) {
        setMessage("Could not sync bookings.");
        return;
      }
      const diag = result.diagnostics;
      const detail = diag?.error
        ? ` Storage error: ${diag.error}`
        : diag?.mode === "production-blobs"
          ? " Shared storage is active."
          : "";
      setMessage(
        `Shared storage updated — ${result.count} booking${result.count === 1 ? "" : "s"} visible.${detail}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="poke-panel mb-6 border-poke-blue/30 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="poke-title text-lg font-black text-poke-navy">
            Sync booking list
          </h2>
          <p className="mt-1 text-sm font-semibold text-poke-navy/70">
            Pull every booking into shared storage so the full list shows for
            admin. Safe to click — nothing is deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isPending}
          className="poke-btn shrink-0 px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {isPending ? "Syncing..." : "Sync all bookings"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-bold text-green-700">{message}</p>
      ) : null}
    </div>
  );
}
