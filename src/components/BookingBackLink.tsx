"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { releaseActiveSlotHold } from "@/components/BookingHoldGate";

interface BookingBackLinkProps {
  href: string;
  label: string;
  artistId: string;
  slotId: string;
}

/** Release the hold without blocking — used before client navigation on mobile. */
export function releaseHoldAndNavigate(
  router: ReturnType<typeof useRouter>,
  href: string,
  artistId: string,
  slotId: string,
): void {
  void releaseActiveSlotHold(artistId, slotId);
  router.push(href);
}

export function BookingBackLink({
  href,
  label,
  artistId,
  slotId,
}: BookingBackLinkProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    releaseHoldAndNavigate(router, href, artistId, slotId);
  }, [artistId, href, isNavigating, router, slotId]);

  return (
    <button
      type="button"
      onClick={handleNavigate}
      disabled={isNavigating}
      className="inline-flex items-center gap-1 text-sm font-bold text-white/90 transition hover:text-poke-yellow disabled:opacity-60"
    >
      ← {label}
    </button>
  );
}
