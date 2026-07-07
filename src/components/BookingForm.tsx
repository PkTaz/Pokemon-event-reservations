"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { releaseHoldAndNavigate } from "@/components/BookingBackLink";
import { PokemonParty } from "@/components/PokemonParty";
import { SlotHoldTimer } from "@/components/SlotHoldTimer";
import { submitBooking } from "@/lib/actions/booking";
import {
  BOOKING_ACKNOWLEDGEMENT_ITEMS,
  COLOR_PREFERENCE_OPTIONS,
  PLACEMENT_OPTIONS,
} from "@/lib/constants";
import type { BookingFormData, PartyMember } from "@/lib/types";
import { isValidPlacement, validateBookingForm } from "@/lib/validation";
import { Card } from "./ui";

interface BookingFormProps {
  artistId: string;
  artistName: string;
  party: PartyMember[];
  slotId: string;
  slotLabel: string;
  slotsBackHref: string;
  eventDate: string;
  holdExpiresAt: string;
}

export function BookingForm({
  artistId,
  artistName,
  party,
  slotId,
  slotLabel,
  slotsBackHref,
  eventDate,
  holdExpiresAt,
}: BookingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BookingFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const placement = formData.get("placement");
    const colorPreference = formData.get("colorPreference");

    const payload: Partial<BookingFormData> = {
      artistId,
      slotId,
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      placement: isValidPlacement(placement) ? placement : undefined,
      colorPreference:
        colorPreference === "color" ||
        colorPreference === "black_gray" ||
        colorPreference === "artist_recommendation"
          ? colorPreference
          : undefined,
      confirmPackPull: formData.get("confirmPackPull") === "on",
      confirmArtistApproval: formData.get("confirmArtistApproval") === "on",
      confirmAgeAndId: formData.get("confirmAgeAndId") === "on",
    };

    const validationErrors = validateBookingForm(payload);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await submitBooking(payload);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push(`/confirmation/${result.booking.id}`);
  }

  return (
    <Card>
      <SlotHoldTimer
        expiresAt={holdExpiresAt}
        artistId={artistId}
        slotId={slotId}
        eventDate={eventDate}
      />

      <div className="poke-panel-inset mb-6 mt-4 space-y-4 p-4 text-sm">
        <div>
          <span className="font-black text-poke-navy">Trainer: </span>
          <span className="font-black text-poke-blue">{artistName}</span>
        </div>
        <PokemonParty party={party} size="sm" showNames label="Trainer's favorites" />
        <p>
          <span className="font-black text-poke-navy">Battle slot: </span>
          <span className="font-bold">{slotLabel}</span>
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border-2 border-poke-red bg-red-50 px-4 py-3 text-sm font-bold text-poke-red">
          {error}
          {error.includes("just booked") ? (
            <p className="mt-2">
              <button
                type="button"
                className="underline"
                onClick={() => {
                  releaseHoldAndNavigate(router, slotsBackHref, artistId, slotId);
                }}
              >
                Choose another battle slot
              </button>
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Full name" error={fieldErrors.name}>
          <input
            name="name"
            type="text"
            required
            className={inputClass}
            autoComplete="name"
          />
        </Field>

        <Field label="Phone" error={fieldErrors.phone}>
          <input
            name="phone"
            type="tel"
            required
            className={inputClass}
            autoComplete="tel"
          />
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            autoComplete="email"
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-black text-poke-navy">
            Placement area <span className="text-poke-red">*</span>
          </legend>
          <div className="flex flex-wrap gap-4">
            {PLACEMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm font-bold text-poke-navy"
              >
                <input
                  type="radio"
                  name="placement"
                  value={option.value}
                  required
                  className="h-4 w-4 accent-poke-yellow"
                />
                {option.label}
              </label>
            ))}
          </div>
          {fieldErrors.placement ? (
            <p className="mt-1 text-sm font-bold text-poke-red">
              {fieldErrors.placement}
            </p>
          ) : null}
        </fieldset>

        <Field label="Color preference" error={fieldErrors.colorPreference}>
          <select name="colorPreference" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select a preference
            </option>
            {COLOR_PREFERENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="poke-panel-inset border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-100 px-4 py-3 text-sm">
          <p className="font-black uppercase tracking-wide text-purple-900">
            Flash event — preset designs
          </p>
          <p className="mt-1 font-semibold text-purple-950">
            Every tattoo uses a preset flash design matched to your pack pull.
            Designs are not customizable. You also have a chance to pull a rare
            card for a special bonus design!
          </p>
        </div>

        {BOOKING_ACKNOWLEDGEMENT_ITEMS.map((item) => (
          <CheckboxField
            key={item.key}
            name={item.key}
            label={item.label}
            error={fieldErrors[item.key]}
          />
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="poke-btn w-full px-4 py-3 text-sm disabled:opacity-60"
        >
          {isSubmitting ? "Reserving..." : "Reserve my spot"}
        </button>
      </form>
    </Card>
  );
}

const inputClass =
  "poke-input w-full px-3 py-2 text-sm font-semibold";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-black text-poke-navy">
        {label} <span className="text-poke-red">*</span>
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-sm font-bold text-poke-red">{error}</p>
      ) : null}
    </div>
  );
}

function CheckboxField({
  name,
  label,
  error,
}: {
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm font-semibold text-poke-navy">
        <input
          type="checkbox"
          name={name}
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-poke-yellow"
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="mt-1 text-sm font-bold text-poke-red">{error}</p>
      ) : null}
    </div>
  );
}
