"use client";

import { useEffect, useState } from "react";

// Zeigt an, wann die Kurse zuletzt aktualisiert wurden (relative Zeit,
// clientseitig berechnet, damit die Zeitzone stimmt).
export function LastUpdated({ iso }: { iso: string | null }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!iso) {
      setText("noch nicht aktualisiert");
      return;
    }
    const update = () => {
      const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (diffMin < 1) setText("gerade eben aktualisiert");
      else if (diffMin < 60) setText(`aktualisiert vor ${diffMin} Min`);
      else {
        const h = Math.floor(diffMin / 60);
        if (h < 24) setText(`aktualisiert vor ${h} Std`);
        else setText(`aktualisiert am ${new Date(iso).toLocaleDateString("de-DE")}`);
      }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [iso]);

  if (!text) return null;
  return <span className="text-xs text-neutral-600">{text}</span>;
}
