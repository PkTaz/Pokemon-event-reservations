"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookingForm } from "@/components/BookingForm";
import { Card } from "@/components/ui";
import { claimSlotHold, releaseSlotHold } from "@/lib/actions/booking";
import type { PartyMember } from "@/lib/types";

interface BookingHoldGateProps {
  artistId: string;
  artistName: string;
  party: PartyMember[];
  slotId: string;
  slotLabel: string;
  slotsBackHref: string;
  eventDate: string;
}

export function BookingHoldGate({
  artistId,
  artistName,
  party,
  slotId,
  slotLabel,
  slotsBackHref,
  eventDate,
}: BookingHoldGateProps) {
  const router = useRouter();
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasHoldRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void claimSlotHold(artistId, slotId).then((result) => {
      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        router.replace(slotsBackHref);
        router.refresh();
        return;
      }

      hasHoldRef.current = true;
      setHoldExpiresAt(result.expiresAt);
    });

    function releaseIfHeld() {
      if (!hasHoldRef.current) return;
      hasHoldRef.current = false;
      void releaseSlotHold(artistId, slotId);
    }

    window.addEventListener("pagehide", releaseIfHeld);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", releaseIfHeld);
      releaseIfHeld();
    };
  }, [artistId, slotId, slotsBackHref, router]);

  if (error) {
    return (
      <Card className="text-center text-sm font-bold text-poke-red">
        {error}
      </Card>
    );
  }

  if (!holdExpiresAt) {
    return (
      <Card className="text-center">
        <p className="text-sm font-black text-poke-navy">Reserving your slot…</p>
        <p className="mt-1 text-xs font-semibold text-poke-navy/60">
          One moment while we hold this time for you.
        </p>
      </Card>
    );
  }

  return (
    <BookingForm
      artistId={artistId}
      artistName={artistName}
      party={party}
      slotId={slotId}
      slotLabel={slotLabel}
      slotsBackHref={slotsBackHref}
      eventDate={eventDate}
      holdExpiresAt={holdExpiresAt}
    />
  );
}

/** Call before navigating away so the slot is free before the next page loads. */
export async function releaseActiveSlotHold(
  artistId: string,
  slotId: string,
): Promise<void> {
  await releaseSlotHold(artistId, slotId);
}
