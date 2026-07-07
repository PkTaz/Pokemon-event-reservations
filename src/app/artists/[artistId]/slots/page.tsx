import { notFound, redirect } from "next/navigation";
import { EventDayPicker } from "@/components/EventDayPicker";
import { PokemonParty } from "@/components/PokemonParty";
import { SlotPicker } from "@/components/SlotPicker";
import { TrainerPartyNote } from "@/components/TrainerPartyNote";
import { BackLink, Container, PageHeader } from "@/components/ui";
import { getArtistById } from "@/lib/data/artists";
import { EVENT_DAY_1_ID } from "@/lib/data/event-days";
import { isSignupsOpen } from "@/lib/constants";
import {
  getOpenEventDays,
  getSlotsByArtistId,
} from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ day?: string }>;
}

export default async function ArtistSlotsPage({ params, searchParams }: PageProps) {
  if (!isSignupsOpen()) {
    redirect("/");
  }

  const { artistId } = await params;
  const { day } = await searchParams;
  const artist = getArtistById(artistId);

  if (!artist) {
    notFound();
  }

  const openDays = await getOpenEventDays();
  const selectedDayId =
    openDays.find((d) => d.id === day)?.id ?? openDays[0]?.id ?? EVENT_DAY_1_ID;

  if (day && !openDays.some((d) => d.id === day)) {
    redirect(`/artists/${artistId}/slots?day=${selectedDayId}`);
  }

  const selectedDay = openDays.find((d) => d.id === selectedDayId);
  const slots = await getSlotsByArtistId(artistId, selectedDayId);

  return (
    <main className="pt-6">
      <Container>
        <div className="mb-6">
          <BackLink href="/artists" label="Back to trainers" />
        </div>

        <PageHeader
          light
          title={`${artist.name}'s Battle Slots`}
          subtitle={
            selectedDay
              ? `Select a time on ${selectedDay.displayLabel}.`
              : "Select an available time to begin your session."
          }
        />

        <EventDayPicker
          days={openDays}
          artistId={artist.id}
          selectedDayId={selectedDayId}
        />

        <div className="poke-panel mb-6 p-4">
          <PokemonParty
            party={artist.party}
            size="md"
            showNames
            label={`${artist.name}'s favorites`}
          />
          <TrainerPartyNote />
        </div>

        <SlotPicker
          artistId={artist.id}
          artistName={artist.name}
          slots={slots}
        />
      </Container>
    </main>
  );
}
