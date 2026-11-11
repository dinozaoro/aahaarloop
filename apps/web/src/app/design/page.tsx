"use client";

import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const COLOR_TOKENS = [
  ["background", "bg-background border"],
  ["foreground", "bg-foreground"],
  ["primary", "bg-primary"],
  ["secondary", "bg-secondary border"],
  ["accent", "bg-accent"],
  ["destructive", "bg-destructive"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["muted", "bg-muted border"],
] as const;

export default function DesignPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          Issue #14
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Design system
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Tokens, primitives and the app shell used across the web app. Every
          interactive control is reachable by keyboard.
        </p>
      </header>

      <section aria-labelledby="tokens" className="flex flex-col gap-4">
        <h2 id="tokens" className="text-xl font-semibold">
          Color tokens
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COLOR_TOKENS.map(([name, className]) => (
            <li key={name} className="flex flex-col gap-2 text-sm">
              <span
                className={`h-16 rounded-lg ${className}`}
                aria-hidden="true"
              />
              <code className="text-muted-foreground">--{name}</code>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Dark-mode tokens exist under <code>.dark</code>; a theme switch is not
          wired yet.
        </p>
      </section>

      <section aria-labelledby="type" className="flex flex-col gap-4">
        <h2 id="type" className="text-xl font-semibold">
          Typography
        </h2>
        <div className="flex flex-col gap-2">
          <p className="text-4xl font-semibold tracking-tight">Text 4xl / 600</p>
          <p className="text-2xl font-semibold tracking-tight">Text 2xl / 600</p>
          <p className="text-lg">Text lg / 400</p>
          <p className="text-sm text-muted-foreground">
            Text sm muted, used for descriptions and metadata.
          </p>
        </div>
      </section>

      <section aria-labelledby="buttons" className="flex flex-col gap-4">
        <h2 id="buttons" className="text-xl font-semibold">
          Buttons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button
            onClick={() =>
              toast.success("Draft saved", {
                description: "Your donation draft is stored on this device.",
              })
            }
          >
            Show toast
          </Button>
        </div>
      </section>

      <section aria-labelledby="forms" className="flex flex-col gap-4">
        <h2 id="forms" className="text-xl font-semibold">
          Form controls
        </h2>
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="demo-name">Food name</FieldLabel>
              <Input
                id="demo-name"
                placeholder="Vegetable biryani"
                aria-describedby="demo-name-description"
              />
              <FieldDescription id="demo-name-description">
                Shown to recipients in the browse list.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-category">Category</FieldLabel>
              <Select id="demo-category" defaultValue="produce">
                <option value="produce">Produce</option>
                <option value="bakery">Bakery</option>
                <option value="prepared">Prepared meals</option>
              </Select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="demo-invalid">Servings</FieldLabel>
              <Input
                id="demo-invalid"
                defaultValue="0"
                aria-invalid="true"
                aria-describedby="demo-invalid-error"
              />
              <FieldError id="demo-invalid-error">
                Enter at least one serving.
              </FieldError>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="demo-notes">Notes</FieldLabel>
              <Textarea id="demo-notes" placeholder="Allergens, packaging, handling…" />
            </Field>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="feedback" className="flex flex-col gap-4">
        <h2 id="feedback" className="text-xl font-semibold">
          Badges and overlays
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this donation?</DialogTitle>
                <DialogDescription>
                  Cancelling releases any claim and records the reason in the
                  donation timeline.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep donation</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive">Cancel donation</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Pickup details</SheetTitle>
                <SheetDescription>
                  Sheets reuse the dialog focus trap and are used for mobile
                  navigation and filters.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <section aria-labelledby="tabs" className="flex flex-col gap-4">
        <h2 id="tabs" className="text-xl font-semibold">
          Tabs
        </h2>
        <Tabs defaultValue="active">
          <TabsList aria-label="Donation states">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expiring">Expiring soon</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <p className="text-sm text-muted-foreground">
              Published donations with remaining servings.
            </p>
          </TabsContent>
          <TabsContent value="expiring">
            <p className="text-sm text-muted-foreground">
              Donations within the urgency window.
            </p>
          </TabsContent>
          <TabsContent value="history">
            <p className="text-sm text-muted-foreground">
              Delivered, cancelled and expired donations.
            </p>
          </TabsContent>
        </Tabs>
      </section>

      <section aria-labelledby="table" className="flex flex-col gap-4">
        <h2 id="table" className="text-xl font-semibold">
          Table
        </h2>
        <Card className="p-0">
          <Table>
            <TableCaption>Demo claims, not live data.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Donation</TableHead>
                <TableHead>Servings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Vegetable biryani</TableCell>
                <TableCell>40</TableCell>
                <TableCell>
                  <Badge variant="warning">Pending</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bakery surplus</TableCell>
                <TableCell>25</TableCell>
                <TableCell>
                  <Badge variant="success">Confirmed</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      <section aria-labelledby="logo" className="flex flex-col gap-4">
        <h2 id="logo" className="text-xl font-semibold">
          Logo
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">
            Temporary text-based mark. The SVG symbol is isolated in{" "}
            <code>LogoMark</code> so it can be replaced without touching the
            wordmark.
          </p>
        </div>
      </section>
    </div>
  );
}
