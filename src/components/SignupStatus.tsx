"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCountdownValues,
  PokemonCountdown,
} from "@/components/PokemonCountdown";
import { ButtonLink } from "./ui";

interface SignupStatusProps {
  unlockAt: string;
  unlockLabel: string;
  initiallyOpen: boolean;
}

export function SignupStatus({
  unlockAt,
  unlockLabel,
  initiallyOpen,
}: SignupStatusProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [timeLeft, setTimeLeft] = useState(() =>
    getCountdownValues(new Date(unlockAt)),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isOpen) return;

    const target = new Date(unlockAt);

    const tick = () => {
      const next = getCountdownValues(target);
      setTimeLeft(next);

      if (next.expired) {
        setIsOpen(true);
        router.refresh();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mounted, isOpen, router, unlockAt]);

  if (isOpen) {
    return (
      <>
        <p className="text-lg font-black text-green-700">
          ⚡ Signups are open — spots are limited!
        </p>
        <ButtonLink href="/artists">Reserve Your Spot</ButtonLink>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-base font-bold text-poke-navy sm:text-lg">
        Reservations unlock{" "}
        <span className="font-black text-poke-blue-dark">{unlockLabel}</span>
      </p>

      <PokemonCountdown
        values={mounted ? timeLeft : null}
        loading={!mounted}
      />
    </div>
  );
}
