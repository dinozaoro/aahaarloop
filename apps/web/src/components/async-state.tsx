"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = "loading" | "error" | "empty" | "success";

export function AsyncState({
  status,
  title,
  description,
  action,
  className,
}: {
  status: Status;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const Icon =
    status === "loading"
      ? LoaderCircle
      : status === "error"
        ? CircleAlert
        : CircleCheck;

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-6 text-muted-foreground",
          status === "loading" && "animate-spin motion-reduce:animate-none",
          status === "error" && "text-destructive",
          status === "success" && "text-success"
        )}
      />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <AsyncState
      status="loading"
      title={label}
      description="Fetching the latest demo data."
    />
  );
}

export function DemoBanner() {
  return (
    <p
      role="note"
      className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-accent-foreground"
    >
      Demo data: this prototype stores changes in memory and resets when the
      server restarts.
    </p>
  );
}

export function IdleHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
