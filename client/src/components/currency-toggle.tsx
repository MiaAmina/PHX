import { useCurrency, CURRENCIES, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign } from "lucide-react";

function CurrencyDropdown() {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-currency-toggle">
          <DollarSign className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="dropdown-currency">
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code as Currency)}
            className={currency === c.code ? "bg-accent" : ""}
            data-testid={`currency-option-${c.code}`}
          >
            <span className="mr-2">{c.symbol}</span>
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CurrencyToggle() {
  return <CurrencyDropdown />;
}

export function PublicCurrencyToggle() {
  return <CurrencyDropdown />;
}
