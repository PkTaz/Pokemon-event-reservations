"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { releaseActiveSlotHold } from "@/components/BookingHoldGate";

interface BookingBackLinkProps {
  href: string;
  label: string;
  artistId: string;
  slotId: string;
}

export function BookingBackLink({
  href,
  label,
  artistId,
  slotId,
}: BookingBackLinkProps) {
  const router = useRouter();
  const [isReleasing, setIsReleasing] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (isReleasing) return;

    setIsReleasing(true);
    await releaseActiveSlotHold(artistId, slotId);
    router.push(href);
    router.refresh();
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-sm font-bold text-white/90 transition hover:text-poke-yellow ${
        isReleasing ? "pointer-events-none opacity-60" : ""
      }`}
    >
      ← {label}
    </Link>
  );
}
