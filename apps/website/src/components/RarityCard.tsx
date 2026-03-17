import GlassCard from "./GlassCard";

export default function RarityCard({
  name,
  multiplier,
  dropRate,
  color,
  bgGlow,
}: {
  name: string;
  multiplier: string;
  dropRate: string;
  color: string;
  bgGlow: string;
}) {
  return (
    <GlassCard
      className="relative overflow-hidden"
      style={{
        borderLeftWidth: 2,
        borderLeftColor: color,
        boxShadow: `inset 2px 0 16px ${bgGlow}, 0 2px 8px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status LED */}
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <div>
            <h4
              className="text-sm font-mono font-medium tracking-wide uppercase"
              style={{ color }}
            >
              {name}
            </h4>
            <p className="text-[10px] text-[#5B616E] font-mono mt-0.5">
              {dropRate} drop rate
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold text-white font-mono">
            {multiplier}
          </p>
          <p className="text-[10px] text-[#5B616E] font-mono uppercase tracking-wide">
            hashpower
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
