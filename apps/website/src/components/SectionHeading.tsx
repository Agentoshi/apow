import { cn } from "@/lib/utils";

export default function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-12 text-center", className)}>
      <h2 className="text-[28px] font-semibold tracking-[0.02em] text-[#e5e5e8] mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] text-[#e5e5e8]/50 max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
