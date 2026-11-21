import { cn } from "@/lib/utils";
import { Papicon } from "@/components/papicon";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-foreground text-background",
        className,
      )}
    >
      <Papicon name="cutlery" className="size-4 brightness-0 invert" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-semibold tracking-[-0.04em] text-[1.05rem]">
        AahaarLoop
      </span>
    </span>
  );
}
