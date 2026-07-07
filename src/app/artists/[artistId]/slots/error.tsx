"use client";

import { BackLink, Container } from "@/components/ui";

export default function ArtistSlotsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="pt-6">
      <Container className="max-w-2xl">
        <div className="mb-6">
          <BackLink href="/artists" label="Back to trainers" />
        </div>
        <div className="poke-panel border-poke-red/40 bg-red-50 p-6">
          <h1 className="poke-title text-xl font-black text-poke-navy">
            Could not load time slots
          </h1>
          <p className="mt-3 text-sm font-semibold text-poke-navy/80">
            We could not reach the booking database. Please try again.
          </p>
          {error.message ? (
            <p className="mt-3 text-xs font-bold text-poke-red">{error.message}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="poke-btn mt-5 px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </Container>
    </main>
  );
}
