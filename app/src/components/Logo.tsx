/**
 * The pendeln mark (design handoff 7a/8a): a "P" drawn as a metro map —
 * U3 orange top, U4 green diagonal, U1 red stem, white station dots and
 * the Karlsplatz interchange pill. The lockup overlaps the mark into
 * "endeln" so the red stem is the P's descender.
 */

export function PendelnMark({ size = 43, dots = true }: { size?: number; dots?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden>
      <path d="M40 18 H92" stroke="#ef7d00" strokeWidth="12" strokeLinecap="round" />
      <path d="M92 20 V52 L70 74 H44" fill="none" stroke="#00963f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 16 V120" stroke="#e20613" strokeWidth="12" strokeLinecap="round" />
      {dots && (
        <>
          <circle cx="44" cy="18" r="8" fill="#fffdf6" stroke="#1c1a12" strokeWidth="6" />
          <circle cx="92" cy="18" r="8" fill="#fffdf6" stroke="#1c1a12" strokeWidth="6" />
          <circle cx="81" cy="63" r="6" fill="#fffdf6" stroke="#1c1a12" strokeWidth="5" />
          <rect x="35" y="61" width="18" height="26" rx="9" fill="#fffdf6" stroke="#1c1a12" strokeWidth="6" />
          <circle cx="44" cy="102" r="6" fill="#fffdf6" stroke="#1c1a12" strokeWidth="5" />
        </>
      )}
    </svg>
  );
}

/** Full lockup — P-mark + "endeln". Proportions from artboard 8a. */
export function PendelnLogo({ fontSize = 24, word = "endeln" }: { fontSize?: number; word?: string }) {
  // 8a ratios at font 45px: svg 97x150, shifted down 40px, text pulled left 50px
  const w = fontSize * (97 / 45);
  const h = fontSize * (150 / 45);
  const dots = true; // Ana's call: the station dots ride at every size
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", lineHeight: 1 }} aria-label={`p${word}`}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 128 152"
        style={{ transform: `translateY(${fontSize * (40 / 45)}px)` }}
        aria-hidden
      >
        <path d="M40 18 H92" stroke="#ef7d00" strokeWidth="12" strokeLinecap="round" />
        <path d="M92 20 V52 L70 74 H44" fill="none" stroke="#00963f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 16 V138" stroke="#e20613" strokeWidth="12" strokeLinecap="round" />
        {dots && (
          <>
            <circle cx="44" cy="18" r="8" fill="#fffdf6" stroke="#1c1a12" strokeWidth="5" />
            <circle cx="92" cy="18" r="8" fill="#fffdf6" stroke="#1c1a12" strokeWidth="5" />
            <circle cx="81" cy="63" r="6" fill="#fffdf6" stroke="#1c1a12" strokeWidth="4.5" />
            <rect x="35" y="62" width="18" height="26" rx="9" fill="#fffdf6" stroke="#1c1a12" strokeWidth="5" />
            <circle cx="44" cy="114" r="6" fill="#fffdf6" stroke="#1c1a12" strokeWidth="4.5" />
          </>
        )}
      </svg>
      <span
        style={{
          fontWeight: 700,
          fontSize,
          letterSpacing: "-0.03em",
          color: "#1c1a12",
          marginLeft: -fontSize * (50 / 45),
        }}
      >
        {word}
      </span>
    </span>
  );
}
