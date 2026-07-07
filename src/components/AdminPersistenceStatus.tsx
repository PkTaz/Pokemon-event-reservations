import type { PersistenceDiagnostics } from "@/lib/persistence";

interface AdminPersistenceStatusProps {
  diagnostics: PersistenceDiagnostics;
  bookingCount: number;
}

export function AdminPersistenceStatus({
  diagnostics,
  bookingCount,
}: AdminPersistenceStatusProps) {
  const healthy =
    diagnostics.mode === "production-blobs" &&
    diagnostics.enabled &&
    diagnostics.loaded &&
    !diagnostics.error;

  return (
    <div
      className={`poke-panel mb-6 p-4 text-sm ${
        healthy ? "border-green-700/40 bg-green-50" : "border-amber-600/40 bg-amber-50"
      }`}
    >
      <p className="font-black text-poke-navy">
        Storage status:{" "}
        <span className={healthy ? "text-green-700" : "text-amber-800"}>
          {healthy ? "Shared storage active" : "Check storage"}
        </span>
      </p>
      <p className="mt-1 font-semibold text-poke-navy/80">
        {bookingCount} booking{bookingCount === 1 ? "" : "s"} in admin list ·{" "}
        {diagnostics.bookingCount} loaded from shared storage · mode:{" "}
        {diagnostics.mode}
      </p>
      {diagnostics.error ? (
        <p className="mt-2 font-bold text-poke-red">{diagnostics.error}</p>
      ) : null}
    </div>
  );
}
