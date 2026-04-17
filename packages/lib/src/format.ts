const gbpFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatGbp(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '-';
  return gbpFmt.format(n);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export function orderNumber(d = new Date()): string {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `BAV-${y}${m}${day}-${rand}`;
}

export function returnNumber(d = new Date()): string {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
  return `RMA-${y}${m}-${rand}`;
}

export function ticketNumber(d = new Date()): string {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 100_000).toString().padStart(5, '0');
  return `TKT-${y}${m}-${rand}`;
}
