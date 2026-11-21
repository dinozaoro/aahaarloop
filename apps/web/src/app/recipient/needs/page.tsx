"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import { Breadcrumbs, PageHeader } from "@/components/page-chrome";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getNeedsForOrganization } from "@/lib/data/store";
import {
  CATEGORY_LABELS,
  type FoodCategory,
  type Need,
  type NeedPriority,
} from "@/lib/domain/types";
import { formatDateTime, formatServings } from "@/lib/format";

const PRIORITY_LABELS: Record<NeedPriority, string> = {
  low: "Low",
  normal: "Normal",
  urgent: "Urgent",
};

const PRIORITY_VARIANTS: Record<
  NeedPriority,
  "secondary" | "default" | "destructive"
> = {
  low: "secondary",
  normal: "default",
  urgent: "destructive",
};

interface FormState {
  category: FoodCategory;
  servings: string;
  deadline: string;
  priority: NeedPriority;
  notes: string;
}

const EMPTY_FORM: FormState = {
  category: "produce",
  servings: "",
  deadline: "",
  priority: "normal",
  notes: "",
};

function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromNeed(need: Need): FormState {
  return {
    category: need.category,
    servings: String(need.servings),
    deadline: toDateTimeInput(need.deadlineAt),
    priority: need.priority,
    notes: need.notes,
  };
}

function isPast(need: Need, now: number): boolean {
  return (
    need.status !== "active" || new Date(need.deadlineAt).getTime() <= now
  );
}

function NeedList({
  title,
  description,
  emptyMessage,
  needs,
  past,
  now,
  onEdit,
  onClose,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  needs: readonly Need[];
  past: boolean;
  now: number;
  onEdit: (need: Need) => void;
  onClose: (need: Need) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {needs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          needs.map((need) => (
            <article
              key={need.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card-hover p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium">{CATEGORY_LABELS[need.category]}</h4>
                  <Badge variant={PRIORITY_VARIANTS[need.priority]}>
                    {PRIORITY_LABELS[need.priority]}
                  </Badge>
                  {past ? (
                    <Badge variant="outline">
                      {new Date(need.deadlineAt).getTime() <= now
                        ? "Expired"
                        : need.status === "fulfilled"
                          ? "Fulfilled"
                          : "Closed"}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-primary">
                  {formatServings(need.servings)}
                </span>
              </div>

              <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd>{formatDateTime(need.deadlineAt)}</dd>
                {need.notes ? (
                  <>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="text-pretty">{need.notes}</dd>
                  </>
                ) : null}
              </dl>

              {past ? null : (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(need)}>
                    <Pencil data-icon="inline-start" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onClose(need)}>
                    Close need
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function RecipientNeedsPage() {
  const [needs, setNeeds] = useState<readonly Need[]>(() => [
    ...getNeedsForOrganization(DEMO_RECIPIENT_ORG_ID),
  ]);
  const [now] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Need | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const active = needs.filter((need) => !isPast(need, now));
  const past = needs.filter((need) => isPast(need, now));
  const activeServings = active.reduce((sum, need) => sum + need.servings, 0);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(need: Need) {
    setEditing(need);
    setForm(formFromNeed(need));
    setErrors({});
    setDialogOpen(true);
  }

  function saveNeed() {
    const servings = Number(form.servings);
    const deadlineMs = new Date(form.deadline).getTime();
    const nextErrors: Record<string, string> = {};

    if (!Number.isFinite(servings) || servings <= 0) {
      nextErrors.servings = "Enter a positive number of servings.";
    }
    if (Number.isNaN(deadlineMs)) {
      nextErrors.deadline = "Choose a deadline.";
    } else if (!editing && deadlineMs <= Date.now()) {
      nextErrors.deadline = "Choose a future deadline.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const deadlineAt = new Date(deadlineMs).toISOString();
    const updatedAt = new Date().toISOString();
    const notes = form.notes.trim();

    if (editing) {
      setNeeds((current) =>
        current.map((need) =>
          need.id === editing.id
            ? {
                ...need,
                category: form.category,
                servings,
                deadlineAt,
                priority: form.priority,
                notes,
                status: deadlineMs > Date.now() ? "active" : need.status,
                updatedAt,
              }
            : need
        )
      );
      toast.success("Need updated");
    } else {
      setNeeds((current) => [
        {
          id: `need-${crypto.randomUUID()}`,
          organizationId: DEMO_RECIPIENT_ORG_ID,
          category: form.category,
          servings,
          deadlineAt,
          priority: form.priority,
          notes,
          status: "active",
          createdAt: updatedAt,
          updatedAt,
        },
        ...current,
      ]);
      toast.success("Need added");
    }
    setDialogOpen(false);
  }

  function closeNeed(need: Need) {
    setNeeds((current) =>
      current.map((entry) =>
        entry.id === need.id
          ? { ...entry, status: "closed", updatedAt: new Date().toISOString() }
          : entry
      )
    );
    toast.success("Need closed");
  }

  return (
    <WorkspaceShell><div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[{ label: "Recipient", href: "/recipient" }, { label: "Needs" }]}
      />

      <PageHeader
        title="Recipient needs"
        description="Track what the shelter still needs and what has already been covered. Only active needs steer the matching engine."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add need
          </Button>
        }
      />

      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="flex flex-wrap items-baseline gap-x-12 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">
              {active.length}
            </span>
            <span className="text-sm text-muted-foreground">active needs</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">
              {activeServings}
            </span>
            <span className="text-sm text-muted-foreground">
              servings still needed
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <NeedList
          title="Active needs"
          description="Open requests the matching engine can use."
          emptyMessage="No active needs. Add one to start matching donations."
          needs={active}
          past={false}
          now={now}
          onEdit={openEdit}
          onClose={closeNeed}
        />
        <NeedList
          title="Past needs"
          description="Closed, fulfilled and expired requests."
          emptyMessage="Nothing here yet. Closed needs will be kept for reference."
          needs={past}
          past
          now={now}
          onEdit={openEdit}
          onClose={closeNeed}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit need" : "Add need"}</DialogTitle>
            <DialogDescription>
              Describe one food category the shelter needs. These details are
              used to score and filter matching donations.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="need-category">Category</FieldLabel>
              <Select
                id="need-category"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as FoodCategory,
                  })
                }
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.servings) || undefined}>
                <FieldLabel htmlFor="need-servings">Servings</FieldLabel>
                <Input
                  id="need-servings"
                  type="number"
                  min="1"
                  step="1"
                  value={form.servings}
                  aria-invalid={Boolean(errors.servings)}
                  onChange={(event) =>
                    setForm({ ...form, servings: event.target.value })
                  }
                />
                <FieldError>{errors.servings}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.deadline) || undefined}>
                <FieldLabel htmlFor="need-deadline">Deadline</FieldLabel>
                <Input
                  id="need-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  aria-invalid={Boolean(errors.deadline)}
                  onChange={(event) =>
                    setForm({ ...form, deadline: event.target.value })
                  }
                />
                <FieldError>{errors.deadline}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="need-priority">Priority</FieldLabel>
              <Select
                id="need-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority: event.target.value as NeedPriority,
                  })
                }
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="need-notes">Notes</FieldLabel>
              <Textarea
                id="need-notes"
                value={form.notes}
                placeholder="Allergens, packaging or handling instructions"
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNeed}>{editing ? "Save changes" : "Add need"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div></WorkspaceShell>
  );
}
