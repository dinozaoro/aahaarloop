import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Construction } from "lucide-react";
import Link from "next/link";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
  issue?: number;
}) {
  return (
    <div className="site-shell grid min-h-[55vh] place-items-center py-14">
      <section className="w-full max-w-2xl border-t-2 border-primary pt-7">
        <Construction aria-hidden="true" className="size-6 text-primary" />
        <p className="eyebrow mt-6">Not available in this preview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-7")}>Explore AahaarLoop <ArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
