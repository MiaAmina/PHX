import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "SAR" | "USD" | "IDR" | "PKR";

interface CurrencyRate {
  code: Currency;
  label: string;
  symbol: string;
  rate: number;
}

export const CURRENCIES: CurrencyRate[] = [
  { code: "SAR", label: "SAR", symbol: "﷼", rate: 1 },
  { code: "USD", label: "USD", symbol: "$", rate: 1 / 3.75 },
  { code: "IDR", label: "IDR", symbol: "Rp", rate: 4213.33 },
  { code: "PKR", label: "PKR", symbol: "₨", rate: 74.13 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (sarAmount: string | number) => string;
  formatPrice: (sarAmount: string | number) => string;
  symbol: string;
  label: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "SAR",
  setCurrency: () => {},
  convert: (v) => String(v),
  formatPrice: (v) => `SAR ${v}`,
  symbol: "﷼",
  label: "SAR",
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("phx-currency") as Currency) || "SAR";
    }
    return "SAR";
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("phx-currency", c);
  };

  const info = CURRENCIES.find((r) => r.code === currency) || CURRENCIES[0];

  const convert = (sarAmount: string | number): string => {
    const val = typeof sarAmount === "string" ? parseFloat(sarAmount) : sarAmount;
    if (isNaN(val)) return "0.00";
    const converted = val * info.rate;
    if (currency === "IDR") return Math.round(converted).toLocaleString();
    return converted.toFixed(2);
  };

  const formatPrice = (sarAmount: string | number): string => {
    return `${info.code} ${convert(sarAmount)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatPrice, symbol: info.symbol, label: info.label }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
