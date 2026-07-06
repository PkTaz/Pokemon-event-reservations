import type { PartyMember } from "@/lib/types";

const PARTY_SIZE = 6;

interface PokemonPartyProps {
  party: PartyMember[];
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  label?: string;
}

const sizeMap = {
  sm: { slot: "h-10 w-10", sprite: "h-6 w-6", text: "text-[8px]", gap: "gap-1.5" },
  md: { slot: "h-14 w-14", sprite: "h-9 w-9", text: "text-[10px]", gap: "gap-2" },
  lg: { slot: "h-16 w-16", sprite: "h-11 w-11", text: "text-xs", gap: "gap-3" },
};

function normalizeParty(party: PartyMember[]): PartyMember[] {
  const slots = [...party.slice(0, PARTY_SIZE)];
  while (slots.length < PARTY_SIZE) {
    slots.push({ name: "" });
  }
  return slots;
}

export function PokemonParty({
  party,
  size = "md",
  showNames = false,
  label = "Party",
}: PokemonPartyProps) {
  const slots = normalizeParty(party);
  const dimensions = sizeMap[size];

  return (
    <div>
      {label ? (
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-poke-navy/60">
          {label}
        </p>
      ) : null}
      <div className={`flex flex-wrap justify-center ${dimensions.gap}`}>
        {slots.map((member, index) => (
          <PokemonPartySlot
            key={`${member.name}-${index}`}
            member={member}
            slotClass={dimensions.slot}
            spriteClass={dimensions.sprite}
            nameClass={dimensions.text}
            showName={showNames}
            slotNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

interface PokemonPartySlotProps {
  member: PartyMember;
  slotClass: string;
  spriteClass: string;
  nameClass: string;
  showName: boolean;
  slotNumber: number;
}

export function PokemonPartySlot({
  member,
  slotClass,
  spriteClass,
  nameClass,
  showName,
  slotNumber,
}: PokemonPartySlotProps) {
  const empty = !member.name;
  const initials = member.name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative ${slotClass} shrink-0 rounded-full border-[3px] border-black bg-black p-[2px]`}
        title={empty ? `Empty slot ${slotNumber}` : member.name}
      >
        {/* Red top / white bottom halves inside black ring */}
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <div className="absolute inset-0 flex flex-col">
            <div className="h-1/2 bg-[#ee1515]" />
            <div className="h-1/2 bg-white" />
          </div>

          {/* Equator line like classic party slots */}
          <div className="absolute left-0 right-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-black/80" />

          {/* Sprite or placeholder */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-1">
            {member.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.imageUrl}
                alt={member.name}
                className={`${spriteClass} object-contain drop-shadow-sm`}
              />
            ) : empty ? (
              <span className={`${nameClass} font-black text-black/25`}>—</span>
            ) : (
              <span
                className={`${nameClass} select-none font-black leading-none text-poke-navy/70`}
                aria-hidden="true"
              >
                {initials}
              </span>
            )}
          </div>
        </div>
      </div>

      {showName && member.name ? (
        <span className={`${nameClass} max-w-[3.5rem] truncate text-center font-bold text-poke-navy`}>
          {member.name}
        </span>
      ) : null}
    </div>
  );
}
