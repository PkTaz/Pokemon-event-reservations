import { TRAINER_PARTY_NOTE } from "@/lib/constants";

interface TrainerPartyNoteProps {
  variant?: "banner" | "inline";
}

export function TrainerPartyNote({ variant = "inline" }: TrainerPartyNoteProps) {
  if (variant === "banner") {
    return (
      <div className="poke-panel-inset mb-8 border-2 border-poke-blue bg-blue-50 p-4 text-center">
        <p className="text-sm font-black text-poke-navy">
          Trainer parties ≠ your tattoo pull
        </p>
        <p className="mt-1 text-sm font-semibold text-poke-navy/80">
          {TRAINER_PARTY_NOTE}
        </p>
      </div>
    );
  }

  return (
    <p className="mt-2 text-center text-[10px] font-semibold leading-snug text-poke-navy/65">
      {TRAINER_PARTY_NOTE}
    </p>
  );
}
