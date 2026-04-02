import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, DollarSign, Shield, Clock } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { label: string; className: string }> = {
    HELD: { label: t("transactions.held"), className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    RELEASED_TO_HOTEL: { label: t("transactions.releasedToHotel"), className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    REFUNDED_TO_AGENT: { label: t("transactions.refundedToAgent"), className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  };
  const c = config[status] || { label: status, className: "bg-gray-500/20 text-gray-400" };
  return <Badge variant="outline" className={c.className} data-testid={`badge-status-${status}`}>{c.label}</Badge>;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const { data: txns, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const transactions = txns || [];

  const totalHeld = transactions.filter(t => t.escrowStatus === "HELD").reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0);
  const totalReleased = transactions.filter(t => t.escrowStatus === "RELEASED_TO_HOTEL").reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0);
  const totalRefunded = transactions.filter(t => t.escrowStatus === "REFUNDED_TO_AGENT").reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-transactions-title">
          <Receipt className="w-6 h-6 text-[#D4AF37]" />
          {t("transactions.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-transactions-subtitle">
          {t("transactions.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("transactions.held")}</p>
              <p className="text-lg font-bold text-amber-400" data-testid="text-total-held">{formatPrice(totalHeld)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("transactions.releasedToHotel")}</p>
              <p className="text-lg font-bold text-emerald-400" data-testid="text-total-released">{formatPrice(totalReleased)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("transactions.refundedToAgent")}</p>
              <p className="text-lg font-bold text-blue-400" data-testid="text-total-refunded">{formatPrice(totalRefunded)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-lg">{t("transactions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-transactions">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("transactions.noTransactions")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-transactions">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.bookingId")}</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.amountPaid")}</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.totalAmount")}</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.escrowStatus")}</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.paymentReference")}</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">{t("transactions.payoutDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn: any) => (
                    <tr key={txn.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-transaction-${txn.id}`}>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{txn.bookingId?.substring(0, 8)}...</td>
                      <td className="p-3 text-[#D4AF37] font-semibold">{formatPrice(parseFloat(txn.amountPaid || "0"))}</td>
                      <td className="p-3 text-foreground font-semibold">{formatPrice(parseFloat(txn.totalAmount || "0"))}</td>
                      <td className="p-3"><StatusBadge status={txn.escrowStatus} /></td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{txn.paymentReference || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {txn.payoutDate ? new Date(txn.payoutDate).toLocaleDateString() : t("transactions.pending")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
