export function pct(value: number) {
  return value.toLocaleString(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  });
}

export function shortTime(iso?: string) {
  if (!iso) return "Not saved";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
