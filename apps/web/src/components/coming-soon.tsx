import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ComingSoon({
  title,
  description,
  issue,
}: {
  title: string;
  description: string;
  issue: number;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Card className="reveal shadow-lifted press-scale">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Issue #{issue}
          </Badge>
          <CardTitle className="text-2xl font-display">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/design" className={cn(buttonVariants())}>
            View the design system
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
