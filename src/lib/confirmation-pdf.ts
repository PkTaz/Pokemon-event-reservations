import type { BookingAcknowledgements } from "@/lib/types";

export interface ConfirmationPdfData {
  bookingId: string;
  trainerName: string;
  artistName: string;
  eventDay: string;
  battleSlot: string;
  customerName: string;
  phone: string;
  email: string;
  placement: string;
  colorPreference: string;
  status: string;
  acknowledgements: BookingAcknowledgements;
  acknowledgementLabels: readonly { key: keyof BookingAcknowledgements; label: string }[];
  reminders: readonly string[];
  bookedAt: string;
}

export async function downloadConfirmationPdf(
  data: ConfirmationPdfData,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const margin = 16;
  let y = 20;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.getWidth();

  function heading(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 46);
    doc.text(text, margin, y);
    y += 10;
  }

  function line(label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text(`${label}:`, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 26, 46);
    const wrapped = doc.splitTextToSize(value, pageWidth - margin * 2 - 40);
    doc.text(wrapped, margin + 38, y);
    y += Math.max(lineHeight, wrapped.length * lineHeight);
  }

  function paragraph(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 46);
    const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
  }

  function ensureSpace(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  doc.setFillColor(59, 76, 202);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 203, 5);
  doc.text("Pokémon Flash Event", margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Booking Confirmation", margin, 24);

  y = 38;
  heading("Your reservation");
  line("Confirmation #", data.bookingId);
  line("Booked on", data.bookedAt);
  line("Status", data.status);
  y += 4;

  ensureSpace(40);
  heading("Appointment");
  line("Trainer", data.trainerName);
  line("Event day", data.eventDay);
  line("Battle slot", data.battleSlot);
  y += 4;

  ensureSpace(40);
  heading("Your details");
  line("Name", data.customerName);
  line("Phone", data.phone);
  line("Email", data.email);
  line("Placement", data.placement);
  line("Color preference", data.colorPreference);
  y += 4;

  ensureSpace(50);
  heading("Acknowledged at booking");
  for (const item of data.acknowledgementLabels) {
    ensureSpace(20);
    const confirmed = data.acknowledgements[item.key] ? "Yes" : "No";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(34, 120, 60);
    doc.text(`[${confirmed}]`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(26, 26, 46);
    const wrapped = doc.splitTextToSize(item.label, pageWidth - margin * 2 - 12);
    doc.text(wrapped, margin + 12, y);
    y += wrapped.length * 4.5 + 4;
  }

  ensureSpace(40);
  heading("Event reminders");
  for (const reminder of data.reminders) {
    ensureSpace(12);
    paragraph(`• ${reminder}`);
  }

  y += 6;
  ensureSpace(16);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  paragraph(
    "Bring this confirmation and valid government-issued ID to the event. Arrive 10 minutes early.",
  );

  doc.save(`pokemon-flash-event-${data.bookingId}.pdf`);
}
