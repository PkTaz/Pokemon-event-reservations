"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAdmin } from "@/lib/actions/booking";
import { Card } from "./ui";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const result = await loginAdmin(password);

    if (!result.ok) {
      setError("Incorrect password.");
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="poke-title mb-4 text-lg font-black text-poke-navy">
        Admin Login
      </h2>
      {error ? (
        <p className="mb-3 text-sm font-bold text-poke-red">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-black text-poke-navy">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            className="poke-input w-full px-3 py-2 text-sm font-semibold"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="poke-btn w-full px-4 py-2 text-sm disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </Card>
  );
}
