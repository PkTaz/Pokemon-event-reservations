import { EVENT_RULES } from "@/lib/constants";
import { Card } from "./ui";

export function EventRules() {
  return (
    <Card>
      <h2 className="poke-title mb-3 text-lg font-black uppercase tracking-wide text-poke-navy">
        📋 Event Rules
      </h2>
      <ul className="space-y-2">
        {EVENT_RULES.map((rule) => (
          <li
            key={rule}
            className="flex gap-2 text-sm font-semibold text-poke-navy/90"
          >
            <span className="text-poke-red" aria-hidden="true">
              ▸
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </Card>
  );
}
