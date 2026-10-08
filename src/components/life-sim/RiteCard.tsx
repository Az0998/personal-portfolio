"use client";

import type { RiteBeat } from "@/lib/life-sim/rite";

export function RiteCard({
  rite,
  onDismiss,
  final = false,
}: {
  rite: RiteBeat;
  onDismiss?: () => void;
  final?: boolean;
}) {
  return (
    <aside className={`ls-rite ${final ? "final" : ""}`} role="status" aria-live="polite">
      <p className="ls-rite-stage">{rite.stage}</p>
      <h2 className="ls-rite-epithet">{rite.epithet}</h2>
      <p className="ls-rite-verse">{rite.verse}</p>
      <ul className="ls-rite-seals">
        {rite.seals.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {onDismiss && (
        <button type="button" className="ls-btn" onClick={onDismiss}>
          {final ? "收下碑文" : "继续命运"}
        </button>
      )}
    </aside>
  );
}
