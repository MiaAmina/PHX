import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2, Wallet, Lock, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Landmark, Receipt, CheckCircle2, Clock, Snowflake, Ban, RotateCcw
} from "lucide-react";

function TxTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const config: Record<string, { label: string; className: string; icon: any }> = {
    ESCROW_HOLD: { label: t("wallet.escrowHold"), className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Lock },
    COMMISSION_CREDIT: { label: t("wallet.commissionCredit"), className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: ArrowDownCircle },
    PLATFORM_FEE: { label: t("wallet.platformFee"), className: "bg-red-500/20 text-red-400 border-red-500/30", icon: Landmark },
    PAYOUT_PENDING: { label: t("wallet.payoutPending"), className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
    PAYOUT_COMPLETED: { label: t("wallet.payoutCompleted"), className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    REVERSION: { label: t("wallet.reversion"), className: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: RotateCcw },
  };
  const c = config[type] || { label: type, className: "bg-gray-500/20 text-gray-400", icon: Receipt };
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`${c.className} flex items-center gap-1`} data-testid={`badge-type-${type}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </Badge>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: t("wallet.pending"), className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    SETTLED: { label: t("wallet.settled"), className: "bg-green-500/20 text-green-400 border-green-500/30" },
    FROZEN: { label: t("wallet.frozen"), className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const c = config[status] || { label: status, className: "bg-gray-500/20 text-gray-400" };
  return <Badge variant="outline" className={c.className} data-testid={`badge-status-${status}`}>{c.label}</Badge>;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatPrice, label: currencyLabel } = useCurrency();
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  const { data: wallet, isLoading: walletLoading } = useQuery<any>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const { data: txns, isLoading: txnsLoading } = useQuery<any[]>({
    queryKey: ["/api/wallet/transactions"],
    enabled: !!user,
  });

  const payoutMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/wallet/payout", { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("wallet.payoutRequested"), description: t("wallet.payoutSuccess") });
      setPayoutOpen(false);
      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (walletLoading || txnsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const balance = parseFloat(wallet?.balance || "0");
  const lockedBalance = parseFloat(wallet?.lockedBalance || "0");
  const totalEarned = parseFloat(wallet?.totalEarned || "0");
  const transactions = txns || [];
  const canRequestPayout = user?.role === "HOTEL" || user?.role === "BROKER";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-wallet-title">
            <Wallet className="w-6 h-6 text-[#D4AF37]" />
            {t("wallet.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-wallet-subtitle">
            {t("wallet.subtitle")}
          </p>
        </div>
        {canRequestPayout && balance > 0 && (
          <Button
            onClick={() => setPayoutOpen(true)}
            className="bg-[#D4AF37] hover:bg-[#C9A030] text-black font-semibold"
            data-testid="button-request-payout"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            {t("wallet.requestPayout")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("wallet.availableBalance")}</p>
                <p className="text-2xl font-bold text-emerald-400" data-testid="text-available-balance">
                  {formatPrice(balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("wallet.lockedForWithdrawal")}</p>
                <p className="text-2xl font-bold text-amber-400" data-testid="text-locked-balance">
                  {formatPrice(lockedBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("wallet.totalEarned")}</p>
                <p className="text-2xl font-bold text-blue-400" data-testid="text-total-earned">
                  {formatPrice(totalEarned)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D4AF37]" />
            {t("wallet.transactionHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium" data-testid="text-no-transactions">{t("wallet.noTransactions")}</p>
              <p className="text-muted-foreground text-sm mt-1">{t("wallet.noTransactionsDesc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-wallet-transactions">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider py-3 px-3">{t("wallet.type")}</th>
                    <th className="text-right text-xs text-muted-foreground uppercase tracking-wider py-3 px-3">{t("wallet.amount")}</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider py-3 px-3">{t("wallet.reference")}</th>
                    <th className="text-center text-xs text-muted-foreground uppercase tracking-wider py-3 px-3">{t("wallet.status")}</th>
                    <th className="text-right text-xs text-muted-foreground uppercase tracking-wider py-3 px-3">{t("wallet.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/50" data-testid={`row-wallet-tx-${tx.id}`}>
                      <td className="py-3 px-3">
                        <TxTypeBadge type={tx.type} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-semibold ${
                          tx.type === "COMMISSION_CREDIT" || tx.type === "PAYOUT_COMPLETED" ? "text-emerald-400" :
                          tx.type === "ESCROW_HOLD" || tx.type === "PLATFORM_FEE" ? "text-blue-400" :
                          tx.type === "PAYOUT_PENDING" ? "text-amber-400" :
                          tx.type === "REVERSION" ? "text-orange-400" : "text-foreground"
                        }`} data-testid={`text-tx-amount-${tx.id}`}>
                          {formatPrice(parseFloat(tx.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {tx.referenceId ? (
                          <span className="text-muted-foreground text-xs font-mono" data-testid={`text-tx-ref-${tx.id}`}>
                            {tx.referenceType}: {tx.referenceId.substring(0, 8)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <TxStatusBadge status={tx.status} />
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground text-xs" data-testid={`text-tx-date-${tx.id}`}>
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-[#D4AF37]" />
              {t("wallet.requestPayout")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("wallet.availableBalance")}: {formatPrice(balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">{t("wallet.payoutAmount")} ({currencyLabel})</label>
              <Input
                type="number"
                step="0.01"
                min="10"
                max={balance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                className="bg-background border-border text-foreground"
                data-testid="input-payout-amount"
              />
              {parseFloat(payoutAmount) > balance && (
                <p className="text-red-400 text-xs mt-1">{t("wallet.insufficientBalance")}</p>
              )}
              {parseFloat(payoutAmount) > 0 && parseFloat(payoutAmount) < 10 && (
                <p className="text-red-400 text-xs mt-1">{t("wallet.payoutMinimum")}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutOpen(false)}
              className="border-border text-muted-foreground"
              data-testid="button-cancel-payout"
            >
              Cancel
            </Button>
            <Button
              onClick={() => payoutMutation.mutate(payoutAmount)}
              disabled={!payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > balance || parseFloat(payoutAmount) < 10 || payoutMutation.isPending}
              className="bg-[#D4AF37] hover:bg-[#C9A030] text-black font-semibold"
              data-testid="button-confirm-payout"
            >
              {payoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("wallet.requestPayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
