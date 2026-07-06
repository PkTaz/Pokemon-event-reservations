import { notFound, redirect } from "next/navigation";
import { BookingBackLink } from "@/components/BookingBackLink";
import { BookingHoldGate } from "@/components/BookingHoldGate";
import { Container, PageHeader } from "@/components/ui";
import { getArtistById } from "@/lib/data/artists";
import { getSlotById } from "@/lib/data/slots";
import { getSlots } from "@/lib/store";
import { formatSlotLabel } from "@/lib/format";
import { isSignupsOpen } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ artistId?: string; slotId?: string }>;
}

export default async function BookPage({ searchParams }: PageProps) {
  if (!isSignupsOpen()) {
    redirect("/");
  }

  const { artistId, slotId } = await searchParams;

  if (!artistId || !slotId) {
    redirect("/artists");
  }

  const artist = getArtistById(artistId);
  const slot = getSlotById(slotId, getSlots());

  if (!artist || !slot || slot.artistId !== artistId) {
    notFound();
  }

  const slotLabel = formatSlotLabel(slot);
  const slotsBackHref = `/artists/${artistId}/slots?day=${slot.eventDate}`;

  return (
    <main className="pt-6">
      <Container>
        <div className="mb-6">
          <BookingBackLink
            href={slotsBackHref}
            label="Back to battle slots"
            artistId={artist.id}
            slotId={slot.id}
          />
        </div>

        <PageHeader
          light
          title="Complete Your Booking"
          subtitle="Fill in your trainer info to lock in this slot."
        />

        <BookingHoldGate
          artistId={artist.id}
          artistName={artist.name}
          party={artist.party}
          slotId={slot.id}
          slotLabel={slotLabel}
          slotsBackHref={slotsBackHref}
          eventDate={slot.eventDate}
        />
      </Container>
    </main>
  );
}
