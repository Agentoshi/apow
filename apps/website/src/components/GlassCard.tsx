import { cn } from "@/lib/utils";

export default function GlassCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative p-8 rounded-2xl",
        "bg-slate-900/40 backdrop-blur-xl",
        "border border-white/10",
        "shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </div>
  );
}
