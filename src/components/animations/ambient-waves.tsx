/**
 * AmbientWaves — GPU-Safe Ambient Background
 *
 * Architecture: 3 CSS radial-gradient blobs animated via pure CSS @keyframes.
 *
 * Why this is faster than the old system:
 *   - NO mix-blend-screen: eliminated the primary compositor crash trigger
 *   - NO SVG paths: no expensive vector rasterisation
 *   - NO Framer Motion: zero JS runtime cost for the background
 *   - Blobs are small elements blurred at element scale (not 200vw container scale)
 *   - will-change: transform pins each blob to its own predictable GPU layer
 *   - contain: paint prevents repaint propagation outside the container
 *   - Keyframes animate ONLY translate3d() — the only GPU-composited property
 *   - CSS handles animation off the main thread entirely
 *
 * Mobile adaptive (via globals.css):
 *   - @media (max-width: 768px): 3rd blob hidden, opacity reduced, animation slowed
 *   - @media (prefers-reduced-motion): all blobs static
 */
export function AmbientWaves() {
  return (
    <div
      id="ambient-bg"
      aria-hidden="true"
      className="ambient-container"
    >
      {/* Blob 1 — Purple, top-left anchor */}
      <div className="ambient-blob ambient-blob-1" />

      {/* Blob 2 — Blue, bottom-right anchor */}
      <div className="ambient-blob ambient-blob-2" />

      {/* Blob 3 — Cyan accent, center-top anchor (hidden on mobile) */}
      <div className="ambient-blob ambient-blob-3" />
    </div>
  );
}
