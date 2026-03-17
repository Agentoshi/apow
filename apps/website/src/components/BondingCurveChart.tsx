"use client";

export default function BondingCurveChart() {
  const maxPrice = 0.001;
  const minPrice = 0.00005;
  const maxSupply = 100000;

  const points: string[] = [];
  const steps = 60;

  for (let i = 0; i <= steps; i++) {
    const minted = (i / steps) * maxSupply;
    const remaining = maxSupply - minted;
    const price = Math.max(maxPrice * (remaining / maxSupply), minPrice);

    const x = 40 + (i / steps) * 260;
    const y = 140 - ((price - minPrice) / (maxPrice - minPrice)) * 110;
    points.push(`${x},${y}`);
  }

  return (
    <svg
      viewBox="0 0 320 170"
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = 140 - pct * 110;
        return (
          <line
            key={pct}
            x1="40"
            y1={y}
            x2="300"
            y2={y}
            stroke="white"
            strokeOpacity="0.04"
            strokeDasharray="2 4"
          />
        );
      })}

      {/* Curve fill */}
      <polygon
        points={`${points.join(" ")} 300,140 40,140`}
        fill="url(#curveGradient)"
      />

      {/* Curve line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#0052FF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0052FF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0052FF" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y-axis labels */}
      <text
        x="36"
        y="33"
        textAnchor="end"
        fill="#5B616E"
        fontSize="8"
        fontFamily="var(--font-mono)"
      >
        0.001
      </text>
      <text
        x="36"
        y="143"
        textAnchor="end"
        fill="#5B616E"
        fontSize="8"
        fontFamily="var(--font-mono)"
      >
        0.00005
      </text>

      {/* X-axis labels */}
      <text
        x="40"
        y="156"
        textAnchor="start"
        fill="#5B616E"
        fontSize="8"
        fontFamily="var(--font-mono)"
      >
        0
      </text>
      <text
        x="300"
        y="156"
        textAnchor="end"
        fill="#5B616E"
        fontSize="8"
        fontFamily="var(--font-mono)"
      >
        100K
      </text>

      {/* Axis titles */}
      <text
        x="170"
        y="168"
        textAnchor="middle"
        fill="#32353D"
        fontSize="7"
        fontFamily="var(--font-mono)"
      >
        RIGS MINTED
      </text>
      <text
        x="10"
        y="85"
        textAnchor="middle"
        fill="#32353D"
        fontSize="7"
        fontFamily="var(--font-mono)"
        transform="rotate(-90, 10, 85)"
      >
        PRICE (ETH)
      </text>

      {/* Start/end markers */}
      <circle cx="40" cy="30" r="2.5" fill="#0052FF" />
      <circle cx="300" cy="134.5" r="2.5" fill="#0052FF" opacity="0.4" />
    </svg>
  );
}
