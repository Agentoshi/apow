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
      <h2 className="text-[32px] font-bold tracking-[-0.03em] text-white mb-3 font-mono">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] text-[#717886] max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
