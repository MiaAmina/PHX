import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import {
  AlertTriangle,
  Snowflake,
  Hotel,
  UserCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  DollarSign,
  Clock,
  Shield,
} from "lucide-react";

export default function AdminDisputesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const { data: disputes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/disputes"],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ escrowId, action }: { escrowId: string; action: string }) => {
      const res = await apiRequest("POST", `/api/admin/disputes/${escrowId}/resolve`, { action });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("dispute.resolved"), description: t("dispute.resolvedDesc") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/escrow"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const activeDisputes = disputes || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-disputes-title">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          {t("dispute.management")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-disputes-subtitle">
          {t("dispute.managementDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-red-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <Snowflake className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Disputes</p>
                <p className="text-2xl font-bold text-red-400" data-testid="text-dispute-count">{activeDisputes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Frozen Funds</p>
                <p className="text-2xl font-bold text-amber-400" data-testid="text-frozen-funds">
                  {formatPrice(activeDisputes.reduce((sum: number, d: any) => sum + parseFloat(d.escrowBalance || "0"), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Wait</p>
                <p className="text-2xl font-bold text-blue-400" data-testid="text-avg-wait">
                  {activeDisputes.length > 0
                    ? Math.round(activeDisputes.reduce((sum: number, d: any) => sum + (Date.now() - new Date(d.frozenAt).getTime()) / 3600000, 0) / activeDisputes.length)
                    : 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            Frozen Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDisputes.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium" data-testid="text-no-disputes">{t("dispute.noDisputes")}</p>
              <p className="text-muted-foreground text-sm mt-1">{t("dispute.noDisputesDesc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-disputes">
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Booking</TableHead>
                    <TableHead className="text-muted-foreground">Agent</TableHead>
                    <TableHead className="text-muted-foreground">Broker</TableHead>
                    <TableHead className="text-muted-foreground">Hotel</TableHead>
                    <TableHead className="text-muted-foreground text-right">Escrow Balance</TableHead>
                    <TableHead className="text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-muted-foreground">Frozen Since</TableHead>
                    <TableHead className="text-muted-foreground text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDisputes.map((d: any) => (
                    <TableRow key={d.id} className="border-border/50 hover:bg-muted/50" data-testid={`row-dispute-${d.id}`}>
                      <TableCell className="font-mono text-xs text-foreground/80" data-testid={`text-dispute-booking-${d.id}`}>
                        {d.bookingId.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-foreground/80 text-sm" data-testid={`text-dispute-agent-${d.id}`}>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                          {d.agentName}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground/80 text-sm">{d.brokerName}</TableCell>
                      <TableCell className="text-foreground/80 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-emerald-400" />
                          {d.hotelName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-amber-400" data-testid={`text-dispute-amount-${d.id}`}>
                        {formatPrice(d.escrowBalance)}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-red-400 text-xs truncate" title={d.disputeReason} data-testid={`text-dispute-reason-${d.id}`}>
                          {d.disputeReason || "Admin freeze"}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs" data-testid={`text-dispute-date-${d.id}`}>
                        {d.frozenAt ? new Date(d.frozenAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        }) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            disabled={resolveMutation.isPending}
                            onClick={() => resolveMutation.mutate({ escrowId: d.id, action: "RELEASE_TO_HOTEL" })}
                            data-testid={`button-release-hotel-${d.id}`}
                          >
                            {resolveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin me-1" /> : <ArrowUpCircle className="w-3.5 h-3.5 me-1" />}
                            {t("dispute.releaseToHotel")}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            disabled={resolveMutation.isPending}
                            onClick={() => resolveMutation.mutate({ escrowId: d.id, action: "REFUND_TO_AGENT" })}
                            data-testid={`button-refund-agent-${d.id}`}
                          >
                            {resolveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin me-1" /> : <ArrowDownCircle className="w-3.5 h-3.5 me-1" />}
                            {t("dispute.refundToAgent")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
