"use client";

import { BackLink, Container } from "@/components/ui";

export default function AdminError({
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
          <BackLink href="/" label="Home" />
        </div>
        <div className="poke-panel border-poke-red/40 bg-red-50 p-6">
          <h1 className="poke-title text-xl font-black text-poke-navy">
            Admin page failed to load
          </h1>
          <p className="mt-3 text-sm font-semibold text-poke-navy/80">
            This usually means the database connection needs attention on Render,
            or the site is still running an older deploy. Try again in a moment.
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
