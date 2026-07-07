import { AdminAddBookingForm } from "@/components/AdminAddBookingForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminDatabaseStatus } from "@/components/AdminDatabaseStatus";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminResetDataButton } from "@/components/AdminResetDataButton";
import { AdminSecondDayToggle } from "@/components/AdminSecondDayToggle";
import { Card, Container, PageHeader, BackLink } from "@/components/ui";
import {
  fetchAdminBookings,
  fetchAdminSlotOptions,
  fetchDatabaseStatus,
  fetchSecondDayStatus,
} from "@/lib/actions/admin";
import { isAdminAuthenticated } from "@/lib/actions/booking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <main className="pt-6">
        <Container>
          <div className="mb-6">
            <BackLink href="/" label="Home" />
          </div>
          <PageHeader light title="Admin Dashboard" subtitle="Staff access only" />
          <AdminLoginForm />
        </Container>
      </main>
    );
  }

  const bookings = await fetchAdminBookings();
  const secondDay = await fetchSecondDayStatus();
  const openSlots = (await fetchAdminSlotOptions()) ?? [];
  const database =
    (await fetchDatabaseStatus()) ?? {
      enabled: false,
      connected: false,
      bookingCount: 0,
      error: "Unable to read database status",
    };

  return (
    <main className="pt-6">
      <Container className="max-w-7xl">
        <div className="mb-6">
          <BackLink href="/" label="Home" />
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="poke-title text-3xl font-black text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 font-semibold text-blue-100">All event bookings</p>
          </div>
          <AdminLogoutButton />
        </div>

        <AdminDatabaseStatus
          diagnostics={database}
          bookingCount={bookings?.length ?? 0}
        />

        <AdminSecondDayToggle initiallyOpen={secondDay?.open ?? false} />

        <AdminAddBookingForm openSlots={openSlots} />

        <AdminResetDataButton />

        <Card className="overflow-hidden p-0">
          <AdminDashboard bookings={bookings ?? []} />
        </Card>
      </Container>
    </main>
  );
}
