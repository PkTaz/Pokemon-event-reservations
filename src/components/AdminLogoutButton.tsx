"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/lib/actions/admin";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAdmin();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="poke-btn-secondary px-4 py-2 text-sm disabled:opacity-60"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
