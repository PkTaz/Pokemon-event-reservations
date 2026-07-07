"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAdminBooking } from "@/lib/actions/admin";
import {
  COLOR_PREFERENCE_OPTIONS,
  PLACEMENT_OPTIONS,
} from "@/lib/constants";
import { ARTISTS } from "@/lib/data/artists";
import type { ColorPreference, Placement } from "@/lib/types";

interface SlotOption {
  id: string;
  artistId: string;
  label: string;
}

interface AdminAddBookingFormProps {
  openSlots: SlotOption[];
}

export function AdminAddBookingForm({ openSlots }: AdminAddBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [artistId, setArtistId] = useState(ARTISTS[0]?.id ?? "");

  const slotsForArtist = openSlots.filter((slot) => slot.artistId === artistId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const placement = formData.get("placement");
    const colorPreference = formData.get("colorPreference");

    if (
      placement !== "arms" &&
      placement !== "legs" &&
      placement !== "unsure_yet"
    ) {
      setError("Choose a placement.");
      return;
    }

    if (
      colorPreference !== "color" &&
      colorPreference !== "black_gray" &&
      colorPreference !== "artist_recommendation"
    ) {
      setError("Choose a color preference.");
      return;
    }

    startTransition(async () => {
      const result = await addAdminBooking({
        artistId,
        slotId: String(formData.get("slotId") ?? ""),
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        placement: placement as Placement,
        colorPreference: colorPreference as ColorPreference,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not add booking.");
        return;
      }

      setMessage("Booking added and saved to shared storage.");
      event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <div className="poke-panel mb-6 p-5">
      <h2 className="poke-title text-lg font-black text-poke-navy">
        Re-add a lost booking
      </h2>
      <p className="mt-1 text-sm font-semibold text-poke-navy/70">
        Use confirmation PDFs or emails to manually restore bookings that were
        lost during the storage upgrade.
      </p>

      {error ? (
        <p className="mt-3 text-sm font-bold text-poke-red">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm font-bold text-green-700">{message}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-black text-poke-navy">
            Trainer
            <select
              value={artistId}
              onChange={(event) => setArtistId(event.target.value)}
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            >
              {ARTISTS.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-black text-poke-navy">
            Open slot
            <select
              name="slotId"
              required
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select a slot
              </option>
              {slotsForArtist.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-black text-poke-navy">
            Name
            <input
              name="name"
              required
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-black text-poke-navy">
            Phone
            <input
              name="phone"
              required
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-black text-poke-navy">
            Email
            <input
              name="email"
              type="email"
              required
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-black text-poke-navy">
            Placement
            <select
              name="placement"
              required
              defaultValue=""
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select placement
              </option>
              {PLACEMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-black text-poke-navy">
            Color preference
            <select
              name="colorPreference"
              required
              defaultValue=""
              className="poke-input mt-1 w-full px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select preference
              </option>
              {COLOR_PREFERENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || slotsForArtist.length === 0}
          className="poke-btn px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add booking"}
        </button>
      </form>
    </div>
  );
}
