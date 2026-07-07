import { notFound } from "next/navigation";
import { ConfirmationView } from "@/components/ConfirmationView";
import { Container, PageHeader, PokeballIcon } from "@/components/ui";
import { fetchBooking, fetchSlots } from "@/lib/actions/booking";
import { EVENT_REMINDERS } from "@/lib/constants";
import { getArtistById } from "@/lib/data/artists";
import { getSlotById } from "@/lib/data/slots";
import {
  formatColorPreference,
  formatEventDate,
  formatPlacement,
  formatTimeRange,
} from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { bookingId } = await params;
  const booking = await fetchBooking(bookingId);

  if (!booking) {
    notFound();
  }

  const artist = getArtistById(booking.artistId);
  const slot = getSlotById(booking.slotId, await fetchSlots());

  if (!artist || !slot) {
    notFound();
  }

  const bookedAt = new Date(booking.createdAt).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });

  return (
    <main className="pt-6">
      <Container>
        <div className="mb-4 flex justify-center">
          <PokeballIcon className="h-12 w-12 poke-bounce" />
        </div>

        <PageHeader
          light
          title="You're Booked!"
          subtitle="Your spot is confirmed. See you at the event, trainer!"
        />

        <ConfirmationView
          bookingId={booking.id}
          trainerName={artist.name}
          party={artist.party}
          eventDay={formatEventDate(slot.eventDate)}
          battleSlot={formatTimeRange(slot.startTime, slot.endTime)}
          customerName={booking.name}
          phone={booking.phone}
          email={booking.email}
          placement={formatPlacement(booking.placement)}
          colorPreference={formatColorPreference(booking.colorPreference)}
          status={booking.status}
          acknowledgements={booking.acknowledgements}
          reminders={[...EVENT_REMINDERS]}
          bookedAt={bookedAt}
        />
      </Container>
    </main>
  );
}
