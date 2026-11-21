export interface DeliveryEta {
  minutesLeft: number;
  overdue: boolean;
  label: string;
}

/** Countdown to the pickup deadline, expressed in whole hours and minutes. */
export function deliveryEta(
  deadlineAt: string,
  now: Date = new Date(),
): DeliveryEta {
  const deadline = Date.parse(deadlineAt);
  if (!Number.isFinite(deadline)) {
    return { minutesLeft: 0, overdue: false, label: "Time to be confirmed" };
  }
  const minutesLeft = Math.round((deadline - now.getTime()) / 60_000);
  const overdue = minutesLeft < 0;
  const absolute = Math.abs(minutesLeft);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  const duration = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  return {
    minutesLeft,
    overdue,
    label: overdue ? `Overdue by ${duration}` : `Arriving in ${duration}`,
  };
}
