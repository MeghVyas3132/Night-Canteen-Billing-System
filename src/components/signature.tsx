"use client";

import { useEffect } from "react";

/**
 * A quiet signature for anyone who opens the devtools console.
 * Invisible during normal use.
 */
export function Signature() {
  useEffect(() => {
    console.log(
      "%cNight Canteen%c  ·  crafted by Megh Vyas",
      "color:#e0a458;font-weight:700;font-size:14px",
      "color:#9aa0b4;font-size:12px",
    );
  }, []);
  return null;
}
