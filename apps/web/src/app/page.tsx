import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-20 sm:px-6">
      <Badge variant="secondary" className="w-fit">
        Foundation
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Every surplus has a destination.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        The web app foundation is in place: design tokens, accessible base
        components and the responsive shell. The landing page lands in issue
        #15.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/design" className={cn(buttonVariants({ size: "lg" }))}>
          Open the component showcase
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Go to the dashboard
        </Link>
      </div>
    </section>
  );
}
