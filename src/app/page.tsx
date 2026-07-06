import { EventRules } from "@/components/EventRules";
import { SignupStatus } from "@/components/SignupStatus";
import {
  AccentBadge,
  Container,
  InfoBox,
  PageHeader,
  PokeballIcon,
} from "@/components/ui";
import {
  formatSignupUnlockLabel,
  getSignupUnlockTime,
  isSignupsOpen,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const signupsOpen = isSignupsOpen();
  const unlockAt = getSignupUnlockTime();

  return (
    <main className="flex-1 pb-10">
      <div className="pb-4 pt-10 text-center">
        <Container className="py-0">
          <div className="mb-4 flex justify-center poke-bounce">
            <PokeballIcon className="h-14 w-14" />
          </div>
          <AccentBadge>Flash Event</AccentBadge>
          <PageHeader
            light
            title="Pokémon Flash Event"
            subtitle="Open a pack. Pull your creature. Get the tattoo."
          />
        </Container>
      </div>

      <Container>
        <div className="poke-panel mb-8 space-y-4 p-6 text-center">
          <SignupStatus
            unlockAt={unlockAt.toISOString()}
            unlockLabel={formatSignupUnlockLabel()}
            initiallyOpen={signupsOpen}
          />
        </div>

        <InfoBox title="How it works" variant="default" className="mb-6">
          <ol className="list-decimal space-y-2 pl-5 font-semibold text-poke-navy">
            <li>Choose your trainer — their party is just personal favorites, not your pull.</li>
            <li>Arrive at the event and open a random creature card pack on site.</li>
            <li>Your tattoo uses a preset flash design based on your pull.</li>
            <li>Your trainer approves final size and placement with you.</li>
          </ol>
        </InfoBox>

        <InfoBox title="✨ Rare card chance" variant="rare" className="mb-6">
          <p className="font-semibold text-purple-950">
            Every pack pull comes with a chance at a rare card — pull one and
            you could unlock a special bonus flash design for your tattoo!
          </p>
        </InfoBox>

        <EventRules />
      </Container>
    </main>
  );
}
