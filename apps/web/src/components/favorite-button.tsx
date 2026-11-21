"use client";

import { useState } from "react";

export function FavoriteButton({ donationId }: { donationId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ donationId, favorite: !favorite }),
      });
      if (response.ok) setFavorite((value) => !value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="outline-action" onClick={toggle} disabled={busy} aria-pressed={favorite}>
      {favorite ? "Saved" : "Save"}
    </button>
  );
}
