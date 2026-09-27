import { currencyLocale, DEFAULT_CURRENCY } from "./currency";

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  return new Intl.NumberFormat(currencyLocale(currency), {
    style: "currency",
    currency,
  }).format(amount);
}

export function currentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Same-month check against "now" — used to gate purchase-revert eligibility. */
export function isCurrentMonth(dateString: string | null): boolean {
  if (!dateString) return false;
  return dateString.slice(0, 7) === currentMonthStart().slice(0, 7);
}

export function formatMonthLabel(monthDate: string): string {
  const [year, month] = monthDate.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
