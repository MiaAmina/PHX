import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Gavel, BookOpen, Package, ArrowUpRight, Warehouse } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { data: ledger, isLoading: ledgerLoading } = useQuery<any>({
    queryKey: ["/api/admin/financial-ledger"],
  });
  const { data: reports, isLoading: reportsLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports"],
  });

  const isLoading = ledgerLoading || reportsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reports-title">{t("reports.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("reports.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("reports.financialOverview")}</CardTitle>
              <CardDescription>{t("reports.revenueBreakdown")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.totalGMV")}</span>
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums" data-testid="text-total-gmv">
                    {formatPrice(ledger?.totalGMV ?? "0.00")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("reports.gmvDesc")}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.wholesaleValue")}</span>
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums" data-testid="text-wholesale-value">
                    {formatPrice(ledger?.totalWholesaleValue ?? "0.00")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("reports.wholesaleDesc")}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.brokerDelta")}</span>
                  </div>
                  <p className="text-3xl font-bold font-mono tabular-nums" data-testid="text-broker-delta">
                    {formatPrice(ledger?.brokerDelta ?? "0.00")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("reports.brokerDeltaDesc")}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Total VAT (15%)</span>
                  <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-total-vat">
                    {formatPrice(ledger?.totalVat ?? "0.00")}
                  </p>
                  <p className="text-xs text-muted-foreground">ZATCA compliant VAT collected</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Total incl. VAT</span>
                  <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-total-with-vat">
                    {formatPrice(ledger?.totalWithVat ?? "0.00")}
                  </p>
                  <p className="text-xs text-muted-foreground">Gross revenue including VAT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LedgerCard
              title={t("reports.liveAuctions")}
              value={ledger?.liveAuctions ?? 0}
              icon={Gavel}
              description={t("reports.currentlyActive")}
              testId="text-live-auctions"
            />
            <LedgerCard
              title={t("reports.endedAuctions")}
              value={ledger?.endedAuctions ?? 0}
              icon={Gavel}
              description={t("reports.settledAuctions")}
              testId="text-ended-auctions"
            />
            <LedgerCard
              title={t("reports.completedBookings")}
              value={ledger?.completedBookings ?? 0}
              icon={BookOpen}
              description={t("reports.agentReservations")}
              testId="text-completed-bookings"
            />
            <LedgerCard
              title={t("reports.wonBlocks")}
              value={ledger?.wonBlocksCount ?? 0}
              icon={Package}
              description={t("reports.brokerInventoryBlocks")}
              testId="text-won-blocks"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("reports.roomInventory")}</CardTitle>
              <CardDescription>{t("reports.roomAllocation")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.roomsBooked")}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-rooms-booked">{ledger?.totalRoomsBooked ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t("reports.roomsBookedDesc")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.roomsAvailable")}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-rooms-available">{ledger?.totalRoomsAvailable ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t("reports.roomsAvailableDesc")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("reports.auctionValue")}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-auction-value">{formatPrice(ledger?.totalAuctionValue ?? "0.00")}</p>
                  <p className="text-xs text-muted-foreground">{t("reports.auctionValueDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("reports.platformUsers")}</CardTitle>
              <CardDescription>{t("reports.userBreakdown")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{t("admin.users.hotels")}</span>
                  <p className="text-xl font-bold">{reports?.totalHotels ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{t("admin.users.brokers")}</span>
                  <p className="text-xl font-bold">{reports?.totalBrokers ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{t("admin.users.agents")}</span>
                  <p className="text-xl font-bold">{reports?.totalAgents ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{t("reports.totalBids")}</span>
                  <p className="text-xl font-bold">{reports?.totalBids ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function LedgerCard({ title, value, icon: Icon, description, testId }: {
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
