import Image from "next/image";
import Link from "next/link";
import { PokemonParty } from "@/components/PokemonParty";
import { TrainerPartyNote } from "@/components/TrainerPartyNote";
import type { PartyMember } from "@/lib/types";

/** Fixed portrait box — every trainer renders at exactly this size. */
const PORTRAIT_SIZE_PX = 240;

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  portraitPosition?: string;
  party: PartyMember[];
  spotsRemaining: number;
}

export function ArtistCard({
  id,
  name,
  imageUrl,
  portraitPosition = "50% 50%",
  party,
  spotsRemaining,
}: ArtistCardProps) {
  const soldOut = spotsRemaining === 0;

  return (
    <article
      className={`poke-panel mx-auto w-full max-w-[17.75rem] p-4 transition sm:max-w-[18.25rem] sm:p-5 ${
        soldOut ? "opacity-60 grayscale-[30%]" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-poke-navy bg-poke-red px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white">
          Trainer
        </p>
        <span
          className={`rounded-full border-2 border-poke-navy bg-white px-2 py-0.5 text-[10px] font-black ${
            soldOut ? "text-zinc-500" : "text-green-700"
          }`}
        >
          {soldOut ? "FAINTED" : `${spotsRemaining} slots`}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {imageUrl ? (
            <div
              className="poke-panel-inset relative shrink-0 overflow-hidden rounded-xl bg-white"
              style={{ width: PORTRAIT_SIZE_PX, height: PORTRAIT_SIZE_PX }}
            >
              <Image
                src={imageUrl}
                alt={`${name} trainer portrait`}
                fill
                sizes={`${PORTRAIT_SIZE_PX}px`}
                className="object-cover"
                style={{ objectPosition: portraitPosition }}
              />
            </div>
          ) : null}
          <h2 className="poke-title text-xl font-black text-poke-navy">{name}</h2>
        </div>

        <div className="poke-panel-inset p-3">
          <PokemonParty
            party={party}
            size="md"
            showNames
            label="Trainer's favorites"
          />
          <TrainerPartyNote />
        </div>

        {soldOut ? (
          <span className="inline-flex justify-center rounded-lg border-2 border-poke-navy bg-zinc-200 px-3 py-2.5 text-xs font-black uppercase text-zinc-500">
            Fully Booked
          </span>
        ) : (
          <Link
            href={`/artists/${id}/slots`}
            className="poke-btn inline-flex justify-center px-3 py-2.5 text-xs"
          >
            Choose {name}
          </Link>
        )}
      </div>
    </article>
  );
}
