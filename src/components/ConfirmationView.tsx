"use client";

import { useEffect, useState } from "react";
import { PokemonParty } from "@/components/PokemonParty";
import { ButtonLink, Card, PokeballIcon } from "@/components/ui";
import {
  downloadConfirmationPdf,
  type ConfirmationPdfData,
} from "@/lib/confirmation-pdf";
import { BOOKING_ACKNOWLEDGEMENT_ITEMS } from "@/lib/constants";
import type { BookingAcknowledgements, PartyMember } from "@/lib/types";

export interface ConfirmationViewProps {
  bookingId: string;
  trainerName: string;
  party: PartyMember[];
  eventDay: string;
  battleSlot: string;
  customerName: string;
  phone: string;
  email: string;
  placement: string;
  colorPreference: string;
  status: string;
  acknowledgements: BookingAcknowledgements;
  reminders: string[];
  bookedAt: string;
}

export function ConfirmationView({
  bookingId,
  trainerName,
  party,
  eventDay,
  battleSlot,
  customerName,
  phone,
  email,
  placement,
  colorPreference,
  status,
  acknowledgements,
  reminders,
  bookedAt,
}: ConfirmationViewProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setShowSaveModal(true);
  }, []);

  const pdfData: ConfirmationPdfData = {
    bookingId,
    trainerName,
    artistName: trainerName,
    eventDay,
    battleSlot,
    customerName,
    phone,
    email,
    placement,
    colorPreference,
    status,
    acknowledgements,
    acknowledgementLabels: BOOKING_ACKNOWLEDGEMENT_ITEMS,
    reminders,
    bookedAt,
  };

  async function handleDownloadPdf() {
    setIsDownloading(true);
    try {
      await downloadConfirmationPdf(pdfData);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      {showSaveModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-poke-navy/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-confirmation-title"
        >
          <div className="poke-panel w-full max-w-md p-6 text-center shadow-2xl">
            <div className="mb-4 flex justify-center">
              <PokeballIcon className="h-14 w-14 poke-bounce" />
            </div>
            <h2
              id="save-confirmation-title"
              className="poke-title text-2xl font-black text-poke-navy"
            >
              You&apos;re booked, trainer!
            </h2>
            <p className="mt-3 text-sm font-semibold text-poke-navy/80">
              Save a copy of your confirmation details as a PDF for your
              records. You&apos;ll want this on event day.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="poke-btn w-full px-4 py-3 text-sm disabled:opacity-60"
              >
                {isDownloading ? "Creating PDF…" : "Download confirmation PDF"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="poke-btn-secondary w-full px-4 py-3 text-sm"
              >
                I&apos;ve saved it — view details
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="mb-6 space-y-3">
        <Row label="Confirmation #" value={bookingId} />
        <Row label="Trainer" value={trainerName} />
        <div className="border-b-2 border-poke-navy/10 pb-3">
          <p className="mb-2 text-sm font-black text-poke-navy/60">
            Trainer&apos;s favorites
          </p>
          <PokemonParty party={party} size="sm" showNames label="" />
        </div>
        <Row label="Event day" value={eventDay} />
        <Row label="Battle slot" value={battleSlot} />
        <Row label="Name" value={customerName} />
        <Row label="Phone" value={phone} />
        <Row label="Email" value={email} />
        <Row label="Placement" value={placement} />
        <Row label="Color preference" value={colorPreference} />
        <Row label="Status" value={status} />
      </Card>

      <Card className="mb-6">
        <h2 className="poke-title mb-3 text-lg font-black text-poke-navy">
          Acknowledged at booking
        </h2>
        <ul className="space-y-3">
          {BOOKING_ACKNOWLEDGEMENT_ITEMS.map((item) => (
            <li
              key={item.key}
              className="flex gap-3 rounded-xl border-2 border-green-700/30 bg-green-50 px-3 py-2.5 text-sm"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-green-700 bg-green-600 text-xs font-black text-white"
                aria-hidden
              >
                ✓
              </span>
              <span className="font-semibold text-poke-navy">
                {acknowledgements[item.key] ? item.label : "Not confirmed"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-6">
        <h2 className="poke-title mb-3 text-lg font-black text-poke-navy">
          Event reminders
        </h2>
        <ul className="space-y-2">
          {reminders.map((reminder) => (
            <li
              key={reminder}
              className="flex gap-2 text-sm font-semibold text-poke-navy/90"
            >
              <span className="text-poke-yellow-dark" aria-hidden="true">
                ★
              </span>
              {reminder}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="poke-btn px-6 py-3 text-sm disabled:opacity-60"
        >
          {isDownloading ? "Creating PDF…" : "Download PDF again"}
        </button>
        <ButtonLink href="/" variant="secondary">
          Back to event home
        </ButtonLink>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b-2 border-poke-navy/10 pb-2 last:border-0 last:pb-0">
      <span className="text-sm font-black text-poke-navy/60">{label}</span>
      <span className="text-right text-sm font-black text-poke-navy">{value}</span>
    </div>
  );
}
