import { redirect } from "next/navigation";
import { ArtistCard } from "@/components/ArtistCard";
import { TrainerPartyNote } from "@/components/TrainerPartyNote";
import { BackLink, Container, PageHeader } from "@/components/ui";
import { fetchArtistsWithAvailability } from "@/lib/actions/booking";
import { isSignupsOpen } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  if (!isSignupsOpen()) {
    redirect("/");
  }

  const artists = await fetchArtistsWithAvailability();

  return (
    <main className="pt-6">
      <Container className="max-w-5xl">
        <div className="mb-6">
          <BackLink href="/" label="Back to event" />
        </div>

        <PageHeader
          light
          title="Choose Your Trainer"
          subtitle="Pick your artist and claim a time slot. Your tattoo creature comes from a random pack — not their party below."
        />

        <TrainerPartyNote variant="banner" />

        <div className="grid grid-cols-1 justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              id={artist.id}
              name={artist.name}
              imageUrl={artist.imageUrl}
              portraitPosition={artist.portraitPosition}
              party={artist.party}
              spotsRemaining={artist.spotsRemaining}
            />
          ))}
        </div>
      </Container>
    </main>
  );
}
