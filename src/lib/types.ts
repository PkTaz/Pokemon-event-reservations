export type Placement = "arms" | "legs" | "unsure_yet";

export type ColorPreference = "color" | "black_gray" | "artist_recommendation";

export type SlotStatus = "available" | "held" | "booked";

export type BookingStatus =
  | "Confirmed"
  | "Checked In"
  | "With Artist"
  | "Completed"
  | "No Show";

export interface PartyMember {
  name: string;
  imageUrl?: string;
}

export interface Artist {
  id: string;
  name: string;
  /** Always 6 slots — matches in-game party display. */
  party: PartyMember[];
  imageUrl?: string;
  /** CSS object-position for portrait crop. Default center. */
  portraitPosition?: string;
}

export interface Slot {
  id: string;
  artistId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

/** Temporary checkout hold — not a confirmed booking yet. */
export interface SlotHold {
  slotId: string;
  artistId: string;
  sessionId: string;
  expiresAt: string;
}

export type ClaimSlotHoldResult =
  | { success: true; expiresAt: string }
  | { success: false; error: string };

export interface BookingAcknowledgements {
  confirmPackPull: boolean;
  confirmArtistApproval: boolean;
  confirmAgeAndId: boolean;
}

export interface Booking {
  id: string;
  artistId: string;
  slotId: string;
  name: string;
  phone: string;
  email: string;
  placement: Placement;
  colorPreference: ColorPreference;
  status: BookingStatus;
  acknowledgements: BookingAcknowledgements;
  aiSummary: string;
  createdAt: string;
}

export interface BookingFormData {
  artistId: string;
  slotId: string;
  name: string;
  phone: string;
  email: string;
  placement: Placement;
  colorPreference: ColorPreference;
  confirmPackPull: boolean;
  confirmArtistApproval: boolean;
  confirmAgeAndId: boolean;
}

export type CreateBookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: string };

export interface AdminBookingInput {
  artistId: string;
  slotId: string;
  name: string;
  phone: string;
  email: string;
  placement: Placement;
  colorPreference: ColorPreference;
}
