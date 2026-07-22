"use client";

export function CrtOverlay() {
  return (
    <>
      {/* Plus-sign grid */}
      <div className="plus-grid fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />
      {/* Noise/grain */}
      <div className="noise-haze fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />
      {/* CRT bloom */}
      <div className="crt-bloom-overlay" aria-hidden="true" />
    </>
  );
}
