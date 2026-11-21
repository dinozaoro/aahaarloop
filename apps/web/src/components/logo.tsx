import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/assets/aahaaroop.png"
      alt="AahaarLoop"
      className={cn("shrink-0 object-contain", className)}
      decoding="async"
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display", className)}>
      <LogoMark />
    </span>
  );
}
