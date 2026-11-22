import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "New donation" };

const STEPS = [
  {
    title: "Food basics",
    description:
      "Name, category and quantity are part of the demo donation model.",
    state: "Model ready",
    href: null,
  },
  {
    title: "Dates, storage and allergens",
    description:
      "Use-by, best-before and pickup deadline are entered separately.",
    state: "Continue",
    href: "/donations/new/dates",
  },
  {
    title: "Pickup location and publish",
    description: "Address, map pin, review and publishing before going live.",
    state: "Continue",
    href: "/donations/new/location",
  },
];

export default function NewDonationPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6"
    >
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Create a donation
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Three short steps
        </h1>
        <p className="text-muted-foreground">
          This prototype keeps the draft on this device. Step 2 validates dates
          and allergens before pickup details are added.
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {index + 1}. {step.title}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step.href ? (
                  <Link href={step.href} className={cn(buttonVariants())}>
                    {step.state}
                  </Link>
                ) : (
                  <Badge variant="outline">{step.state}</Badge>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </main>
  );
}
