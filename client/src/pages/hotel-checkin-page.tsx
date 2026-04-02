import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import {
  QrCode,
  CheckCircle,
  BedDouble,
  Users,
  Scan,
  Shield,
} from "lucide-react";

export default function HotelCheckinPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: bookingsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/hotel/bookings"],
  });

  const checkinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("POST", `/api/hotel/checkin/${bookingId}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/bookings"] });
      toast({ title: t("checkin.checkinSuccess"), description: data.message });
    },
    onError: (err: any) => {
      toast({ title: t("checkin.checkinFailed"), description: err.message, variant: "destructive" });
    },
  });

  const bookings = bookingsData || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-checkin-title">{t("checkin.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("checkin.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("checkin.totalBookings")}</CardTitle>
                <BedDouble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums" data-testid="text-total-bookings">{bookings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("checkin.pendingCheckins")}</CardTitle>
                <Scan className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tabular-nums" data-testid="text-awaiting-checkin">
                  {bookings.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("checkin.roomsPending")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("checkin.escrowProtection")}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold" data-testid="text-escrow-info">{t("escrow.rule8020")}</div>
                <p className="text-xs text-muted-foreground mt-1">{t("checkin.releaseOnScan")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <QrCode className="w-8 h-8 text-muted-foreground mb-3" />
                  <h3 className="text-base font-semibold mb-1">{t("checkin.noBookings")}</h3>
                  <p className="text-sm text-muted-foreground">{t("checkin.noBookingsDesc")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("escrow.bookingId")}</TableHead>
                      <TableHead>{t("escrow.agent")}</TableHead>
                      <TableHead>{t("auctions.roomType")}</TableHead>
                      <TableHead>{t("marketplace.rooms")}</TableHead>
                      <TableHead>{t("checkin.totalPrice")}</TableHead>
                      <TableHead>{t("checkin.escrowStatus")}</TableHead>
                      <TableHead>{t("checkin.created")}</TableHead>
                      <TableHead>{t("escrow.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: any) => {
                      const canCheckin = b.escrowStatus === "MILESTONE_1_PAID";
                      const isSettled = b.escrowStatus === "SETTLED" || b.escrowStatus === "AUTO_RELEASED";
                      return (
                        <TableRow key={b.id} data-testid={`row-booking-checkin-${b.id}`}>
                          <TableCell>
                            <span className="text-xs font-mono">{b.id?.substring(0, 8)}...</span>
                          </TableCell>
                          <TableCell className="text-sm">{b.agentName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <BedDouble className="w-3.5 h-3.5 shrink-0" />
                              {b.roomType}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono tabular-nums">{b.roomCount}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono tabular-nums font-medium">${b.totalPrice}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isSettled ? "default" : b.escrowStatus === "FROZEN" ? "destructive" : "secondary"}>
                              {b.escrowStatus || "NONE"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {canCheckin ? (
                              <Button
                                size="sm"
                                onClick={() => checkinMutation.mutate(b.id)}
                                disabled={checkinMutation.isPending}
                                data-testid={`button-checkin-${b.id}`}
                              >
                                <QrCode className="w-4 h-4 me-1" />
                                {t("checkin.verifyCheckin")}
                              </Button>
                            ) : isSettled ? (
                              <Badge variant="outline">
                                <CheckCircle className="w-3 h-3 me-1" />
                                {t("checkin.alreadyCheckedIn")}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {b.escrowStatus === "FROZEN" ? t("escrow.freeze") : t("checkin.noEscrow")}
                              </span>
                            )}
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
    </div>
  );
}
