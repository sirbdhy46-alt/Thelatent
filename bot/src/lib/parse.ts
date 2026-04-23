export function parseDuration(input: string): number | null {
  const m = input.match(/^(\d+)\s*(s|sec|secs|m|min|mins|h|hr|hrs|d|day|days|w|wk|wks|mo|mon|y|yr)$/i);
  if (!m) return null;
  const n = parseInt(m[1]!, 10);
  const u = m[2]!.toLowerCase();
  const map: Record<string, number> = {
    s: 1000, sec: 1000, secs: 1000,
    m: 60_000, min: 60_000, mins: 60_000,
    h: 3_600_000, hr: 3_600_000, hrs: 3_600_000,
    d: 86_400_000, day: 86_400_000, days: 86_400_000,
    w: 604_800_000, wk: 604_800_000, wks: 604_800_000,
    mo: 2_592_000_000, mon: 2_592_000_000,
    y: 31_536_000_000, yr: 31_536_000_000,
  };
  return n * map[u]!;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}
