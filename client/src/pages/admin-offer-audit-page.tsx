import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowUpRight,
  BedDouble,
} from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "default",
  ACCEPTED: "secondary",
  DECLINED: "outline",
};

export default function AdminOfferAuditPage() {
  const { t } = useTranslation();
  const { data: allOffers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/direct-offers/audit"],
  });
  const { data: staleOffers } = useQuery<any[]>({
    queryKey: ["/api/admin/direct-offers/stale"],
  });

  const offers = allOffers || [];
  const stale = staleOffers || [];
  const pending = offers.filter(o => o.status === "PENDING");
  const accepted = offers.filter(o => o.status === "ACCEPTED");
  const declined = offers.filter(o => o.status === "DECLINED");

  const totalOfferValue = offers.reduce((s, o) => s + parseFloat(o.totalOfferValue || "0"), 0);
  const totalWholesaleValue = offers.reduce((s, o) => s + parseFloat(o.totalWholesaleValue || "0"), 0);
  const totalHiddenMarkup = totalOfferValue - totalWholesaleValue;
  const avgMarkupPct = offers.length > 0
    ? (offers.reduce((s, o) => s + parseFloat(o.markupPercent || "0"), 0) / offers.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-offer-audit-title">{t("offerAudit.directOfferAudit")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("offerAudit.monitorDesc")}
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
              title={t("offerAudit.totalOffers")}
              value={offers.length}
              icon={Send}
              description={`${pending.length} ${t("offerAudit.pending")}, ${accepted.length} ${t("offerAudit.accepted")}, ${declined.length} ${t("offerAudit.declined")}`}
              testId="text-total-offers"
            />
            <SummaryCard
              title={t("offerAudit.totalOfferValue")}
              value={`$${totalOfferValue.toFixed(2)}`}
              icon={DollarSign}
              description={t("offerAudit.sumOfferAmounts")}
              testId="text-total-offer-value"
            />
            <SummaryCard
              title={t("offerAudit.hiddenMarkup")}
              value={`$${totalHiddenMarkup.toFixed(2)}`}
              icon={ArrowUpRight}
              description={t("offerAudit.avgAboveWholesale").replace("{{pct}}", avgMarkupPct)}
              testId="text-hidden-markup"
            />
            <SummaryCard
              title={t("offerAudit.staleOffers")}
              value={stale.length}
              icon={AlertTriangle}
              description={t("offerAudit.pending72")}
              testId="text-stale-offers"
              highlight={stale.length > 0}
            />
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-offers">{t("offerAudit.allOffers")} ({offers.length})</TabsTrigger>
              <TabsTrigger value="stale" data-testid="tab-stale-offers">
                {t("offerAudit.staleOffers")} ({stale.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <OfferTable offers={offers} showVariance />
            </TabsContent>

            <TabsContent value="stale" className="mt-4">
              {stale.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground mb-3" />
                    <h3 className="text-base font-semibold mb-1">{t("offerAudit.noStaleOffers")}</h3>
                    <p className="text-sm text-muted-foreground">{t("offerAudit.allPendingFresh")}</p>
                  </CardContent>
                </Card>
              ) : (
                <OfferTable offers={stale} showVariance />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function OfferTable({ offers, showVariance }: { offers: any[]; showVariance?: boolean }) {
  const { t } = useTranslation();

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Send className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold mb-1">{t("offerAudit.noDirectOffers")}</h3>
          <p className="text-sm text-muted-foreground">{t("offerAudit.noDirectOffersDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("offerAudit.broker")}</TableHead>
              <TableHead>{t("offerAudit.agent")}</TableHead>
              <TableHead>{t("offerAudit.roomType")}</TableHead>
              <TableHead>{t("offerAudit.rooms")}</TableHead>
              <TableHead>{t("offerAudit.wholesale")}</TableHead>
              <TableHead>{t("offerAudit.offerPrice")}</TableHead>
              {showVariance && <TableHead>{t("offerAudit.hiddenMarkup")}</TableHead>}
              <TableHead>{t("offerAudit.status")}</TableHead>
              <TableHead>{t("offerAudit.age")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer: any) => (
              <TableRow key={offer.id} data-testid={`row-audit-offer-${offer.id}`}>
                <TableCell>
                  <span className="text-sm font-medium">{offer.brokerName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{offer.agentName}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BedDouble className="w-3.5 h-3.5 shrink-0" />
                    {offer.auction?.roomType || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono tabular-nums">{offer.roomCount}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono tabular-nums">${offer.wholesalePrice}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono tabular-nums font-medium">${offer.pricePerRoom}</span>
                </TableCell>
                {showVariance && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-mono tabular-nums font-semibold ${parseFloat(offer.hiddenMarkup) > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                        {parseFloat(offer.hiddenMarkup) > 0 ? "+" : ""}${offer.hiddenMarkup}
                      </span>
                      <span className="text-xs text-muted-foreground">({offer.markupPercent}%)</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={statusColors[offer.status] as any} data-testid={`badge-audit-status-${offer.id}`}>
                    {offer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {offer.ageHours < 24
                      ? `${offer.ageHours}h`
                      : `${Math.floor(offer.ageHours / 24)}d ${offer.ageHours % 24}h`
                    }
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ title, value, icon: Icon, description, testId, highlight }: {
  title: string; value: string | number; icon: any; description: string; testId?: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? "text-amber-500" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tabular-nums" data-testid={testId}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
