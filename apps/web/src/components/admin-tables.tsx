"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_RESOURCES, type AdminResource } from "@/lib/admin/data";
import { useRouter } from "next/navigation";

interface Page<T> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}

export function AdminTables() {
  const router = useRouter();
  const [resource, setResource] = useState<AdminResource>("donations");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<Record<string, unknown>>>({
    page: 1,
    pageSize: 20,
    total: 0,
    data: [],
  });
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page) });
    if (search) query.set("search", search);
    void fetch(`/api/admin/${resource}?${query}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setResult(data);
      })
      .catch(() => undefined);
  }, [resource, search, page]);

  async function act(action: "unpublish_donation" | "verify_organization", entityId: string) {
    const entityType = action === "unpublish_donation" ? "donation" : "organization";
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, entityType, entityId }),
    });
    if (response.ok) router.refresh();
  }

  const columns = result.data.length > 0 ? Object.keys(result.data[0]) : [];
  const maxPage = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Admin resources">
        {ADMIN_RESOURCES.map((item) => (
          <Button
            key={item}
            role="tab"
            aria-selected={item === resource}
            variant={item === resource ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setResource(item);
              setPage(1);
            }}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label={`Search ${resource}`}
          placeholder={`Search ${resource}…`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Badge variant="secondary">{result.total} total</Badge>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                  No matching rows.
                </TableCell>
              </TableRow>
            )}
            {result.data.map((row) => (
              <TableRow key={String(row.id)}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setDetail(row)}
                    >
                      {String(row[column] ?? "—")}
                    </button>
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    {resource === "donations" && row.status !== "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void act("unpublish_donation", String(row.id))}
                      >
                        Unpublish
                      </Button>
                    )}
                    {resource === "organizations" && row.verified === false && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void act("verify_organization", String(row.id))}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {result.page} of {maxPage}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= maxPage}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record detail</DialogTitle>
            <DialogDescription>Full stored fields for this record.</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {detail &&
              Object.entries(detail).map(([key, value]) => (
                <div key={key} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="font-medium">{key}</dt>
                  <dd className="break-all text-muted-foreground">{String(value ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
