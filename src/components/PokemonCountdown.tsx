"use client";

export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function getCountdownValues(unlockAt: Date, now = Date.now()): CountdownValues {
  const diff = unlockAt.getTime() - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

interface PokemonCountdownProps {
  values: CountdownValues | null;
  loading?: boolean;
  label?: string;
}

function PokeballAccent({ flip = false }: { flip?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative h-5 w-5 shrink-0 rounded-full border-2 border-poke-navy bg-gradient-to-b from-poke-red from-50% to-white to-50% ${flip ? "-scale-x-100" : ""}`}
    >
      <span className="absolute left-1/2 top-1/2 h-[0.45rem] w-[0.45rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-poke-navy bg-white" />
    </span>
  );
}

function CountdownDigit({
  value,
  label,
  loading,
}: {
  value: number;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center gap-1.5">
      <div className="w-full rounded-lg border-2 border-[#2d5a28] bg-[#1a3318] px-1 py-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]">
        <span className="poke-countdown-digit block text-center font-display text-[1.65rem] leading-none font-black tabular-nums">
          {loading ? "--" : value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-[0.6rem] font-extrabold uppercase tracking-wider text-poke-navy/65">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-1.5 self-start pb-[1.1rem] pt-2"
    >
      <span className="poke-countdown-dot h-[0.35rem] w-[0.35rem] rounded-full bg-poke-navy" />
      <span className="poke-countdown-dot poke-countdown-dot-delay h-[0.35rem] w-[0.35rem] rounded-full bg-poke-navy" />
    </div>
  );
}

export function PokemonCountdown({
  values,
  loading = false,
  label = "Trainer registration opens in",
}: PokemonCountdownProps) {
  const units = [
    { label: "Days", value: values?.days ?? 0 },
    { label: "Hours", value: values?.hours ?? 0 },
    { label: "Min", value: values?.minutes ?? 0 },
    { label: "Sec", value: values?.seconds ?? 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-3 flex items-center justify-center gap-3">
        <PokeballAccent />
        <p className="font-display text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-poke-navy">
          {label}
        </p>
        <PokeballAccent flip />
      </div>

      <div className="rounded-2xl border-[3px] border-poke-navy bg-poke-red-dark p-1.5 shadow-[0_4px_0_var(--poke-navy),inset_0_2px_0_rgba(255,255,255,0.15)]">
        <div className="rounded-xl border-2 border-poke-navy bg-gradient-to-b from-[#c8f0c0] to-[#9fd89a] px-3 py-4 shadow-[inset_0_3px_8px_rgba(0,60,0,0.2),inset_0_-2px_0_rgba(255,255,255,0.35)]">
          <div className="flex items-center justify-center gap-1.5">
            {units.map((unit, index) => (
              <div key={unit.label} className="flex items-center gap-1.5">
                <CountdownDigit
                  value={unit.value}
                  label={unit.label}
                  loading={loading}
                />
                {index < units.length - 1 ? <CountdownSeparator /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
