import { cn } from "@/lib/utils";

/**
 * Temporary text-based mark. Replace `LogoMark` with the final brand symbol
 * when brand assets land; keep the wordmark and the `aria-label` unchanged so
 * surrounding links keep their accessible name.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M12 21c0-5.5 3.5-9 8-9 0 5.5-3.5 9-8 9Z" />
        <path d="M12 21C12 15 8.5 11.5 4 11.5c0 5.5 3.5 9.5 8 9.5Z" />
        <path d="M12 21v-6" />
      </svg>
    </span>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">
        Aahaarloop
      </span>
    </span>
  );
}

export { Logo, LogoMark };
