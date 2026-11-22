"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void fetch("/api/notifications?pageSize=1")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setUnread(data.unread ?? 0);
      })
      .catch(() => undefined);
  }, []);

  async function load() {
    const response = await fetch("/api/notifications");
    if (!response.ok) return;
    const data = await response.json();
    setItems(data.data ?? []);
    setUnread(data.unread ?? 0);
  }

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
    });
    if (!response.ok) return;
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative press-scale"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          onClick={() => void load()}
        >
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[10px]"
            >
              {unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="glass-dark">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Time-critical updates across your workspace.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col divide-y divide-border" aria-label="Notification list">
          {items.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
              {item.readAt === null && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => void markRead(item.id)}
                >
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Link href="/notifications" className="text-sm font-semibold text-primary">
          View all activity
        </Link>
      </SheetContent>
    </Sheet>
  );
}
