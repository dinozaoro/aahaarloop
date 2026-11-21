import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-8 items-center justify-center text-primary", className)}
    >
      <span className="font-normal text-[2rem] leading-none">↻</span>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-semibold tracking-[-0.055em] text-[1.05rem]">
        aahaarloop
      </span>
    </span>
  );
}
