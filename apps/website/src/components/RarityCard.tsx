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
        boxShadow: `inset 2px 0 12px ${bgGlow}, 0 2px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4
            className="text-sm font-medium tracking-wide"
            style={{ color }}
          >
            {name}
          </h4>
          <p className="text-[10px] text-[#e5e5e8]/30 mt-0.5">
            {dropRate} drop rate
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold text-[#e5e5e8]">
            {multiplier}
          </p>
          <p className="text-[10px] text-[#e5e5e8]/30">hashpower</p>
        </div>
      </div>
    </GlassCard>
  );
}
