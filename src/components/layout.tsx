import Link from "next/link";
import { FooterSceneBanner } from "@/components/FooterSceneBanner";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <FooterSceneBanner />
      <div className="border-t-4 border-poke-navy bg-poke-navy py-6 text-center text-xs font-semibold text-blue-200">
        <p>
          Pokémon-inspired flash event — fan tribute, not affiliated with Nintendo
          or The Pokémon Company.
        </p>
        <p className="mt-2">
          <Link
            href="/admin"
            className="font-bold text-poke-yellow hover:underline"
          >
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}

export function SignupsClosedBanner() {
  return (
    <div className="poke-panel-inset border-amber-500 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
      Signups are not open yet. Please check back when the countdown ends.
    </div>
  );
}
