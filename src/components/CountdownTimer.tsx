"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui";

interface CountdownTimerProps {
  unlockAt: string;
}

function getTimeLeft(unlockAt: Date) {
  const diff = unlockAt.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

export function CountdownTimer({ unlockAt }: CountdownTimerProps) {
  const target = new Date(unlockAt);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [unlockAt]);

  if (timeLeft.expired) return null;

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <Card className="text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Signups open in
      </p>
      <div className="grid grid-cols-4 gap-3">
        {units.map((unit) => (
          <div key={unit.label} className="rounded-lg bg-zinc-100 py-3">
            <div className="text-2xl font-bold text-zinc-900">{unit.value}</div>
            <div className="text-xs uppercase text-zinc-500">{unit.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
