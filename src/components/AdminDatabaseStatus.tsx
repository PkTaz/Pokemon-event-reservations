import type { DatabaseDiagnostics } from "@/lib/db/client";

interface AdminDatabaseStatusProps {
  diagnostics: DatabaseDiagnostics;
  bookingCount: number;
}

export function AdminDatabaseStatus({
  diagnostics,
  bookingCount,
}: AdminDatabaseStatusProps) {
  const healthy = diagnostics.enabled && diagnostics.connected && !diagnostics.error;

  return (
    <div
      className={`poke-panel mb-6 p-4 text-sm ${
        healthy ? "border-green-700/40 bg-green-50" : "border-amber-600/40 bg-amber-50"
      }`}
    >
      <p className="font-black text-poke-navy">
        Database status:{" "}
        <span className={healthy ? "text-green-700" : "text-amber-800"}>
          {healthy
            ? "PostgreSQL connected"
            : diagnostics.enabled
              ? "Database connection issue"
              : "In-memory only (dev)"}
        </span>
      </p>
      <p className="mt-1 font-semibold text-poke-navy/80">
        {bookingCount} booking{bookingCount === 1 ? "" : "s"} saved
        {diagnostics.enabled
          ? ` · ${diagnostics.bookingCount} in database`
          : " · set DATABASE_URL in production"}
      </p>
      {diagnostics.error ? (
        <p className="mt-2 font-bold text-poke-red">{diagnostics.error}</p>
      ) : null}
    </div>
  );
}
