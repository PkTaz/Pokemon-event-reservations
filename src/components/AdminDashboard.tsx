"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { changeBookingStatus } from "@/lib/actions/admin";
import { BOOKING_STATUS_OPTIONS } from "@/lib/constants";
import {
  formatColorPreference,
  formatPlacement,
} from "@/lib/format";
import type { BookingStatus, ColorPreference, Placement } from "@/lib/types";

export interface AdminBookingRow {
  id: string;
  timeLabel: string;
  artistName: string;
  name: string;
  phone: string;
  email: string;
  placement: Placement;
  colorPreference: ColorPreference;
  status: BookingStatus;
  aiSummary: string;
}

interface AdminDashboardProps {
  bookings: AdminBookingRow[];
}

export function AdminDashboard({ bookings }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(bookingId: string, status: BookingStatus) {
    startTransition(async () => {
      await changeBookingStatus(bookingId, status);
      router.refresh();
    });
  }

  if (bookings.length === 0) {
    return (
      <p className="p-8 text-center text-sm font-bold text-poke-navy/50">
        No bookings yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b-2 border-poke-navy bg-poke-yellow/30 text-xs font-black uppercase tracking-wide text-poke-navy">
          <tr>
            <th className="px-3 py-3">Time</th>
            <th className="px-3 py-3">Artist</th>
            <th className="px-3 py-3">Name</th>
            <th className="px-3 py-3">Phone</th>
            <th className="px-3 py-3">Email</th>
            <th className="px-3 py-3">Placement</th>
            <th className="px-3 py-3">Color</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">AI Summary</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-b border-poke-navy/10 align-top even:bg-poke-cream/50">
              <td className="px-3 py-3 whitespace-nowrap">{booking.timeLabel}</td>
              <td className="px-3 py-3 whitespace-nowrap">{booking.artistName}</td>
              <td className="px-3 py-3 whitespace-nowrap">{booking.name}</td>
              <td className="px-3 py-3 whitespace-nowrap">{booking.phone}</td>
              <td className="px-3 py-3">{booking.email}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                {formatPlacement(booking.placement)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                {formatColorPreference(booking.colorPreference)}
              </td>
              <td className="px-3 py-3">
                <select
                  value={booking.status}
                  disabled={isPending}
                  onChange={(e) =>
                    handleStatusChange(
                      booking.id,
                      e.target.value as BookingStatus,
                    )
                  }
                  className="rounded border-2 border-poke-navy px-2 py-1 text-xs font-bold"
                >
                  {BOOKING_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="max-w-xs px-3 py-3 text-xs text-zinc-600">
                {booking.aiSummary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
