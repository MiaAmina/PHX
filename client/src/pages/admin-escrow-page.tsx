import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import {
  Shield,
  DollarSign,
  Lock,
  Unlock,
  Eye,
  Snowflake,
  CheckCircle,
  Clock,
  AlertTriangle,
  Percent,
  Wallet,
  ArrowDown,
} from "lucide-react";

const statusConfig: Record<string, { labelKey: string; variant: string; icon: any }> = {
  FUNDED: { labelKey: "escrow.statusFunded", variant: "default", icon: DollarSign },
  MILESTONE_1_PAID: { labelKey: "escrow.status20Released", variant: "secondary", icon: ArrowDown },
  SETTLED: { labelKey: "escrow.statusSettled", variant: "default", icon: CheckCircle },
  AUTO_RELEASED: { labelKey: "escrow.statusAutoReleased", variant: "default", icon: Clock },
  FROZEN: { labelKey: "escrow.statusFrozen", variant: "destructive", icon: Snowflake },
  DISPUTED: { labelKey: "escrow.statusDisputed", variant: "destructive", icon: AlertTriangle },
  REFUNDED: { labelKey: "escrow.statusRefunded", variant: "outline", icon: DollarSign },
};

export default function AdminEscrowPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [freezeDialogId, setFreezeDialogId] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [eventsDialogId, setEventsDialogId] = useState<string | null>(null);
  const [feeInput, setFeeInput] = useState("");

  const { data: escrowRecords, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/escrow"],
  });

  const { data: platformFee } = useQuery<{ platformFeePct: number }>({
    queryKey: ["/api/admin/platform-fee"],
  });

  const { data: events } = useQuery<any[]>({
    queryKey: ["/api/admin/escrow", eventsDialogId, "events"],
    enabled: !!eventsDialogId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/escrow/${eventsDialogId}/events`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/escrow/${id}/freeze`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/escrow"] });
      toast({ title: t("escrow.escrowFrozen") });
      setFreezeDialogId(null);
      setFreezeReason("");
    },
    onError: (err: any) => {
      toast({ title: t("escrow.freezeFailed"), description: err.message, variant: "destructive" });
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/escrow/${id}/unfreeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/escrow"] });
      toast({ title: t("escrow.escrowUnfrozen") });
    },
    onError: (err: any) => {
      toast({ title: t("escrow.unfreezeFailed"), description: err.message, variant: "destructive" });
    },
  });

  const feeMutation = useMutation({
    mutationFn: async (pct: number) => {
      await apiRequest("PATCH", "/api/admin/platform-fee", { pct });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-fee"] });
      toast({ title: t("escrow.feeUpdated") });
      setFeeInput("");
    },
    onError: (err: any) => {
      toast({ title: t("escrow.feeUpdateFailed"), description: err.message, variant: "destructive" });
    },
  });

  const records = escrowRecords || [];
  const totalEscrowBalance = records.reduce((s, r) => s + parseFloat(r.escrowBalance || "0"), 0);
  const totalPaid = records.reduce((s, r) => s + parseFloat(r.totalPaid || "0"), 0);
  const totalBrokerPayouts = records.reduce((s, r) => s + parseFloat(r.brokerPayout || "0"), 0);
  const totalHotelPayouts = records.reduce((s, r) => s + parseFloat(r.hotelPayout || "0"), 0);
  const totalPlatformFees = records.reduce((s, r) => s + parseFloat(r.platformFee || "0"), 0);
  const frozenCount = records.filter(r => r.status === "FROZEN").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-escrow-title">{t("escrow.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("escrow.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title={t("escrow.globalBalance")}
              value={`$${totalEscrowBalance.toFixed(2)}`}
              icon={Shield}
              description={`${records.length} active record(s)`}
              testId="text-global-escrow"
            />
            <SummaryCard
              title={t("escrow.brokerPayouts")}
              value={`$${totalBrokerPayouts.toFixed(2)}`}
              icon={Wallet}
              description={t("escrow.instantReleases")}
              testId="text-broker-payouts"
            />
            <SummaryCard
              title={t("escrow.hotelPayouts")}
              value={`$${totalHotelPayouts.toFixed(2)}`}
              icon={DollarSign}
              description={t("escrow.postCheckinReleases")}
              testId="text-hotel-payouts"
            />
            <SummaryCard
              title={t("escrow.platformFees")}
              value={`$${totalPlatformFees.toFixed(2)}`}
              icon={Percent}
              description={`Current rate: ${platformFee?.platformFeePct ?? 5}%`}
              testId="text-platform-fees"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("escrow.adjustFee")}</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder={`Current: ${platformFee?.platformFeePct ?? 5}%`}
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="w-32"
                    data-testid="input-platform-fee"
                  />
                  <Button
                    onClick={() => {
                      const val = parseFloat(feeInput);
                      if (!isNaN(val) && val >= 0 && val <= 100) {
                        feeMutation.mutate(val);
                      }
                    }}
                    disabled={feeMutation.isPending || !feeInput}
                    data-testid="button-update-fee"
                  >
                    {t("escrow.updateFee")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("escrow.feeDeductionNote")}
                </p>
              </CardContent>
            </Card>

            <Card className={frozenCount > 0 ? "border-destructive/50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("escrow.frozenEscrows")}</CardTitle>
                <Snowflake className={`h-4 w-4 ${frozenCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums" data-testid="text-frozen-count">{frozenCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {frozenCount > 0 ? t("escrow.requiresReview") : t("escrow.noFrozenEscrows")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-8 h-8 text-muted-foreground mb-3" />
                  <h3 className="text-base font-semibold mb-1">{t("escrow.noRecords")}</h3>
                  <p className="text-sm text-muted-foreground">{t("escrow.noRecordsDesc")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("escrow.bookingId")}</TableHead>
                      <TableHead>{t("escrow.agent")}</TableHead>
                      <TableHead>{t("escrow.broker")}</TableHead>
                      <TableHead>{t("escrow.hotel")}</TableHead>
                      <TableHead>{t("escrow.totalPaid")}</TableHead>
                      <TableHead>{t("escrow.escrowBalance")}</TableHead>
                      <TableHead>{t("escrow.broker20")}</TableHead>
                      <TableHead>{t("escrow.hotelPayout")}</TableHead>
                      <TableHead>{t("escrow.fee")}</TableHead>
                      <TableHead>{t("escrow.status")}</TableHead>
                      <TableHead>{t("escrow.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r: any) => {
                      const cfg = statusConfig[r.status] || statusConfig.FUNDED;
                      return (
                        <TableRow key={r.id} data-testid={`row-escrow-${r.id}`}>
                          <TableCell>
                            <span className="text-xs font-mono">{r.bookingId?.substring(0, 8)}...</span>
                          </TableCell>
                          <TableCell className="text-sm">{r.agentName}</TableCell>
                          <TableCell className="text-sm">{r.brokerName}</TableCell>
                          <TableCell className="text-sm">{r.hotelName}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums">${r.totalPaid}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums font-medium">${r.escrowBalance}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums">${r.brokerPayout}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums">${r.hotelPayout}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums">${r.platformFee}</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant as any} data-testid={`badge-escrow-status-${r.id}`}>
                              {t(cfg.labelKey)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEventsDialogId(r.id)}
                                data-testid={`button-view-events-${r.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {r.status === "MILESTONE_1_PAID" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setFreezeDialogId(r.id)}
                                  data-testid={`button-freeze-${r.id}`}
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                              )}
                              {r.status === "FROZEN" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => unfreezeMutation.mutate(r.id)}
                                  disabled={unfreezeMutation.isPending}
                                  data-testid={`button-unfreeze-${r.id}`}
                                >
                                  <Unlock className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!freezeDialogId} onOpenChange={() => setFreezeDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("escrow.freezeEscrow")}</DialogTitle>
            <DialogDescription>
              {t("escrow.freezeDesc")}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("escrow.reason")}
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
            data-testid="input-freeze-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialogId(null)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (freezeDialogId) {
                  freezeMutation.mutate({ id: freezeDialogId, reason: freezeReason });
                }
              }}
              disabled={freezeMutation.isPending}
              data-testid="button-confirm-freeze"
            >
              {t("escrow.freeze")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventsDialogId} onOpenChange={() => setEventsDialogId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("escrow.eventLog")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(events || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("escrow.noEvents")}</p>
            ) : (
              (events || []).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{ev.eventType}</Badge>
                      <span className="text-xs font-mono tabular-nums">${ev.amount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, description, testId }: {
  title: string; value: string | number; icon: any; description: string; testId?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tabular-nums" data-testid={testId}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
