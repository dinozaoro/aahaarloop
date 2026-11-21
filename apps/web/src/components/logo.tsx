import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/assets/aahaaroop.png"
      alt=""
      aria-hidden="true"
      className={cn("size-8 shrink-0 object-contain", className)}
      decoding="async"
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">
        Aahaarloop
      </span>
    </span>
  );
}
