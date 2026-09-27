export interface CurrencyOption {
  code: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", locale: "en-US" },
  { code: "EUR", name: "Euro", locale: "de-DE" },
  { code: "GBP", name: "British Pound", locale: "en-GB" },
  { code: "INR", name: "Indian Rupee", locale: "en-IN" },
  { code: "JPY", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CAD", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", locale: "en-AU" },
  { code: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "SGD", name: "Singapore Dollar", locale: "en-SG" },
];

export const DEFAULT_CURRENCY = "USD";

export function currencyLocale(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US";
}

export function isSupportedCurrency(code: string): boolean {
  return CURRENCIES.some((c) => c.code === code);
}

export function getUserCurrency(user: {
  user_metadata?: { currency?: unknown };
}): string {
  const currency = user.user_metadata?.currency;
  return typeof currency === "string" && isSupportedCurrency(currency)
    ? currency
    : DEFAULT_CURRENCY;
}
