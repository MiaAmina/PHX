import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { getRoomCapacity } from "@shared/schema";
import Papa from "papaparse";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Users,
  Loader2,
  DollarSign,
  BedDouble,
  MapPin,
  UserPlus,
  Upload,
  FileDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Shield,
  Calendar,
  Hash,
  Plane,
  Clock,
  Snowflake,
  AlertCircle,
  ArrowUpRight,
  X,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

const COUNTRIES = [
  "Saudi Arabia","Indonesia","Pakistan","India","Bangladesh","Egypt","Turkey","Nigeria","Malaysia","Morocco",
  "Algeria","Iraq","Sudan","Afghanistan","Yemen","Syria","Tunisia","Somalia","Libya","Jordan","Palestine",
  "Lebanon","Oman","Kuwait","Bahrain","Qatar","UAE","Iran","Senegal","Mali","Niger","Guinea","Ivory Coast",
  "Burkina Faso","Chad","Cameroon","Tanzania","Kenya","Uganda","Ethiopia","Mozambique","South Africa",
  "United States","United Kingdom","Canada","Australia","Germany","France","Netherlands","Belgium","Sweden",
  "Bosnia","Albania","Kosovo","Russia","China","Japan","South Korea","Philippines","Thailand","Uzbekistan",
  "Tajikistan","Kyrgyzstan","Kazakhstan","Turkmenistan","Azerbaijan","Brunei","Maldives","Sri Lanka","Myanmar",
  "Singapore","Other",
];

export default function BookingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
  });
  const { data: storefrontBookings } = useQuery<any[]>({
    queryKey: ["/api/storefront/bookings"],
  });
  const pendingSyncCount = storefrontBookings?.filter((b: any) => !b.nusukSynced).length ?? 0;
  const [manageGuestsBooking, setManageGuestsBooking] = useState<any | null>(null);
  const [addPilgrimBooking, setAddPilgrimBooking] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<string | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const disputeMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/dispute`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("dispute.filed"), description: t("dispute.filedDesc") });
      setDisputeBooking(null);
      setDisputeReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalPilgrims = bookings?.reduce((sum: number, b: any) => sum + (b.pilgrims?.length || 0), 0) || 0;
  const confirmedCount = bookings?.filter((b: any) => b.status === "CONFIRMED").length || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-gradient-to-r from-[#d5cfc5] via-[#c8c0b4] to-[#d5cfc5] dark:from-[#1C2530] dark:via-[#243040] dark:to-[#1C2530] p-6 border border-[#D4AF37]/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-bookings-title">{t("bookings.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("bookings.subtitle")}
            </p>
          </div>
          {bookings && bookings.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center px-4 py-2 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <div className="text-xl font-bold text-[#D4AF37] font-mono">{bookings.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Bookings</div>
              </div>
              <div className="text-center px-4 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xl font-bold text-emerald-400 font-mono">{confirmedCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confirmed</div>
              </div>
              <div className="text-center px-4 py-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                <div className="text-xl font-bold text-blue-400 font-mono">{totalPilgrims}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pilgrims</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingSyncCount > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
          data-testid="alert-bookings-pending-sync"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {pendingSyncCount} storefront {pendingSyncCount === 1 ? "booking" : "bookings"} awaiting Nusuk sync
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilgrims have submitted their details and are ready for ministry submission.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
            onClick={() => navigate("/agent/storefront")}
            data-testid="button-go-to-nusuk"
          >
            <ArrowUpRight className="w-3.5 h-3.5 me-1" />
            Nusuk Dashboard
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-4">
              <Plane className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("bookings.noBookings")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {t("bookings.noBookingsDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any, index: number) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              index={index}
              isExpanded={expandedBooking === booking.id}
              onToggle={() =>
                setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
              }
              onAddPilgrim={() => setAddPilgrimBooking(booking.id)}
              onManageGuests={() => setManageGuestsBooking(booking)}
              onInvoice={() => setInvoiceBooking(booking.id)}
              onDispute={() => setDisputeBooking(booking.id)}
            />
          ))}
        </div>
      )}

      {disputeBooking && (
        <Dialog open={!!disputeBooking} onOpenChange={() => { setDisputeBooking(null); setDisputeReason(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                {t("dispute.fileDispute")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("dispute.fileDisputeDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="text-sm text-muted-foreground">{t("dispute.reason")}</label>
              <textarea
                className="w-full bg-background border border-border rounded-md p-3 text-foreground text-sm min-h-[100px] focus:border-[#D4AF37] focus:outline-none"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={t("dispute.reasonPlaceholder")}
                data-testid="input-dispute-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-border text-muted-foreground" onClick={() => { setDisputeBooking(null); setDisputeReason(""); }} data-testid="button-cancel-dispute">
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={disputeReason.trim().length < 5 || disputeMutation.isPending}
                onClick={() => disputeMutation.mutate({ bookingId: disputeBooking, reason: disputeReason })}
                data-testid="button-confirm-dispute"
              >
                {disputeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                {t("dispute.submitDispute")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {addPilgrimBooking && (
        <AddPilgrimDialog
          bookingId={addPilgrimBooking}
          onClose={() => setAddPilgrimBooking(null)}
        />
      )}

      {manageGuestsBooking && (
        <GuestManagementDialog
          booking={manageGuestsBooking}
          onClose={() => setManageGuestsBooking(null)}
        />
      )}

      {invoiceBooking && (
        <TaxInvoiceDialog
          bookingId={invoiceBooking}
          onClose={() => setInvoiceBooking(null)}
        />
      )}
    </div>
  );
}

function BookingCard({ booking, index, isExpanded, onToggle, onAddPilgrim, onManageGuests, onInvoice, onDispute }: {
  booking: any; index: number; isExpanded: boolean; onToggle: () => void; onAddPilgrim: () => void; onManageGuests: () => void; onInvoice: () => void; onDispute: () => void;
}) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const roomType = booking.block?.auction?.roomType || "Room";
  const capacity = getRoomCapacity(roomType);
  const maxPilgrims = booking.roomCount * capacity;
  const registeredPilgrims = booking.pilgrims?.length || 0;
  const isFull = registeredPilgrims >= maxPilgrims;
  const progressPct = maxPilgrims > 0 ? Math.min((registeredPilgrims / maxPilgrims) * 100, 100) : 0;

  const statusColor = booking.status === "CONFIRMED"
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  const roomTypeIcon = roomType === "Suite"
    ? "text-[#D4AF37]"
    : roomType === "Double"
      ? "text-blue-400"
      : roomType === "Triple"
        ? "text-violet-400"
        : "text-emerald-400";

  return (
    <Card className="border-border hover-elevate transition-all duration-200" data-testid={`card-booking-${booking.id}`}>
      <CardContent className="p-0">
        <div className="flex">
          <div className={`w-1.5 rounded-l-md shrink-0 ${booking.status === "CONFIRMED" ? "bg-emerald-500" : "bg-amber-500"}`} />

          <div className="flex-1 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-md bg-background border border-border flex items-center justify-center ${roomTypeIcon}`}>
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{roomType}</h3>
                    <span className="text-xs text-muted-foreground font-mono">#{booking.invoiceNumber || (index + 1)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {booking.roomCount} room{booking.roomCount > 1 ? "s" : ""}
                    </span>
                    {booking.block?.auction?.distance && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {booking.block.auction.distance}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs border ${statusColor} no-default-active-elevate`}>
                  {booking.status}
                </Badge>
                {booking.escrowStatus && (
                  <Badge
                    variant="outline"
                    className={`text-xs border no-default-active-elevate ${
                      booking.escrowStatus === "SETTLED" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                      booking.escrowStatus === "FROZEN" ? "border-red-500/30 text-red-400 bg-red-500/10" :
                      booking.escrowStatus === "MILESTONE_1_PAID" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                      "border-amber-500/30 text-amber-400 bg-amber-500/10"
                    }`}
                    data-testid={`badge-escrow-${booking.id}`}
                  >
                    <Shield className="w-3 h-3 me-1" />
                    {booking.escrowStatus === "SETTLED" ? t("escrow.settled") || "Settled" :
                     booking.escrowStatus === "FROZEN" ? t("escrow.frozen") || "Frozen" :
                     booking.escrowStatus === "MILESTONE_1_PAID" ? t("escrow.inEscrow") || "In Escrow" :
                     booking.escrowStatus}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md bg-background/60 border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Subtotal</div>
                <div className="font-mono tabular-nums text-sm text-foreground/80">{formatPrice(booking.totalPrice)}</div>
              </div>
              <div className="rounded-md bg-background/60 border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">VAT (15%)</div>
                <div className="font-mono tabular-nums text-sm text-foreground/80">{formatPrice(booking.vatAmount || "0")}</div>
              </div>
              <div className="rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#D4AF37]/70 mb-1">Total</div>
                <div className="font-mono tabular-nums text-sm font-bold text-[#D4AF37]">{formatPrice(booking.totalWithVat || booking.totalPrice)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {t("bookings.pilgrims")}: {registeredPilgrims}/{maxPilgrims}
                </span>
                <span className={`font-medium ${isFull ? "text-emerald-400" : "text-[#D4AF37]"}`}>
                  {isFull ? "Complete" : `${maxPilgrims - registeredPilgrims} remaining`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-emerald-500" : "bg-gradient-to-r from-[#D4AF37] to-[#F5D060]"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-border text-foreground/80" onClick={onManageGuests} data-testid={`button-manage-guests-${booking.id}`}>
                  <Users className="w-3.5 h-3.5 me-1" />
                  {t("bookings.manageGuests")}
                </Button>
                <Button size="sm" variant="outline" className="border-border text-foreground/80" onClick={onAddPilgrim} data-testid={`button-add-pilgrim-${booking.id}`}>
                  <UserPlus className="w-3.5 h-3.5 me-1" />
                  {t("bookings.addPilgrim")}
                </Button>
                {registeredPilgrims > 0 && (
                  <VoucherDownloadButton bookingId={booking.id} />
                )}
                <Button size="sm" variant="outline" className="border-border text-foreground/80" onClick={onInvoice} data-testid={`button-tax-invoice-${booking.id}`}>
                  <Receipt className="w-3.5 h-3.5 me-1" />
                  Tax Invoice
                </Button>
                <InvoicePdfDownloadButton bookingId={booking.id} />
                {booking.escrowStatus === "MILESTONE_1_PAID" && (
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={onDispute} data-testid={`button-dispute-${booking.id}`}>
                    <AlertTriangle className="w-3.5 h-3.5 me-1" />
                    {t("dispute.fileDispute")}
                  </Button>
                )}
                {booking.escrowStatus === "FROZEN" && (
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30" data-testid={`badge-disputed-${booking.id}`}>
                    <Snowflake className="w-3 h-3 me-1" />
                    {t("dispute.disputed")}
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onToggle} data-testid={`button-toggle-pilgrims-${booking.id}`}>
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 me-1" />
                    {t("bookings.hidePilgrims")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 me-1" />
                    {t("bookings.showPilgrims")} ({registeredPilgrims})
                  </>
                )}
              </Button>
            </div>

            {isExpanded && booking.pilgrims && booking.pilgrims.length > 0 && (
              <div className="rounded-md border border-border overflow-x-auto bg-background/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">{t("bookings.name")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.passport")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.nationality")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.dateOfBirth")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.gender")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.visaNumber")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.vaccinationStatus")}</TableHead>
                      <TableHead className="text-muted-foreground">{t("bookings.visaStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.pilgrims.map((p: any) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{p.fullName}</TableCell>
                        <TableCell className="font-mono text-xs text-foreground/80">{p.passportNo}</TableCell>
                        <TableCell className="text-foreground/80">{p.nationality || "—"}</TableCell>
                        <TableCell className="text-foreground/80">{p.dateOfBirth || "—"}</TableCell>
                        <TableCell className="text-foreground/80">{p.gender}</TableCell>
                        <TableCell className="font-mono text-xs text-foreground/80">{p.visaNumber || "—"}</TableCell>
                        <TableCell>
                          {p.vaccinationStatus === "Yes" ? (
                            <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400 no-default-active-elevate"><Shield className="w-3 h-3 me-1" />Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground no-default-active-elevate">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs no-default-active-elevate ${
                              p.visaStatus === "APPROVED"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : p.visaStatus === "REJECTED"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {p.visaStatus === "PENDING" && <Clock className="w-3 h-3 me-1" />}
                            {p.visaStatus === "APPROVED" && <CheckCircle className="w-3 h-3 me-1" />}
                            {p.visaStatus === "REJECTED" && <XCircle className="w-3 h-3 me-1" />}
                            {p.visaStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VoucherDownloadButton({ bookingId }: { bookingId: string }) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/voucher`, {
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voucher-${bookingId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("bookings.voucherDownloaded") });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading} data-testid={`button-download-voucher-${bookingId}`}>
      {downloading ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 me-1" />}
      {t("bookings.downloadVoucher")}
    </Button>
  );
}

function GuestManagementDialog({ booking, onClose }: { booking: any; onClose: () => void }) {
  const { t } = useTranslation();
  const roomType = booking.block?.auction?.roomType || "Room";
  const capacity = getRoomCapacity(roomType);
  const maxPilgrims = booking.roomCount * capacity;
  const registeredPilgrims = booking.pilgrims?.length || 0;
  const remainingSlots = maxPilgrims - registeredPilgrims;
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFullName, setAddFullName] = useState("");
  const [addPassportNo, setAddPassportNo] = useState("");
  const [addNationality, setAddNationality] = useState("");
  const [addDateOfBirth, setAddDateOfBirth] = useState("");
  const [addPassportExpiry, setAddPassportExpiry] = useState("");
  const [addGender, setAddGender] = useState("");
  const [addVisaNumber, setAddVisaNumber] = useState("");
  const [addVaccinated, setAddVaccinated] = useState(false);

  const addPilgrimMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/pilgrims", {
        bookingId: booking.id,
        fullName: addFullName,
        passportNo: addPassportNo,
        nationality: addNationality,
        dateOfBirth: addDateOfBirth,
        passportExpiry: addPassportExpiry,
        gender: addGender,
        visaNumber: addVisaNumber,
        vaccinationStatus: addVaccinated ? "Yes" : "No",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("bookings.pilgrimAdded") });
      setShowAddForm(false);
      setAddFullName(""); setAddPassportNo(""); setAddNationality("");
      setAddDateOfBirth(""); setAddPassportExpiry(""); setAddGender("");
      setAddVisaNumber(""); setAddVaccinated(false);
    },
    onError: (err: any) => {
      toast({ title: t("bookings.addFailed"), description: err.message, variant: "destructive" });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async (pilgrims: any[]) => {
      const res = await apiRequest("POST", `/api/bookings/${booking.id}/pilgrims/bulk`, { pilgrims });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setUploadResult(data);
      setCsvData(null);
      toast({ title: data.message });
    },
    onError: (err: any) => {
      toast({ title: t("bookings.uploadFailed"), description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadResult(null);
    setCsvErrors([]);
    setCsvWarnings([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const localErrors: string[] = [];
        const localWarnings: string[] = [];
        const passportSet = new Set<string>();
        const validRows: any[] = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          const rowNum = i + 1;

          const fullName = row.fullName || row.full_name || row.name || row.Name || row.FullName || "";
          const passportNo = row.passportNo || row.passport_no || row.passport || row.Passport || row.PassportNo || "";
          const nationality = row.nationality || row.Nationality || row.country || row.Country || row.citizenship || row.Citizenship || "";
          const dateOfBirth = row.dateOfBirth || row.date_of_birth || row.DateOfBirth || row.dob || row.DOB || "";
          const gender = row.gender || row.Gender || "";
          const visaNumber = row.visaNumber || row.visa_number || row.VisaNumber || row.visa || "";
          const vaccinationStatus = row.vaccinationStatus || row.vaccination_status || row.VaccinationStatus || row.vaccinated || row.Vaccinated || "";

          if (!fullName.trim()) {
            localErrors.push(`Row ${rowNum}: Missing full name`);
            continue;
          }
          if (!passportNo.trim()) {
            localErrors.push(`Row ${rowNum}: Missing passport number`);
            continue;
          }
          if (!nationality.trim()) {
            localErrors.push(`Row ${rowNum}: Missing nationality / country of citizenship`);
            continue;
          }
          if (!["Male", "Female"].includes(gender.trim())) {
            localErrors.push(`Row ${rowNum}: Invalid gender "${gender}" (must be Male or Female)`);
            continue;
          }

          const passport = passportNo.trim();
          if (passportSet.has(passport)) {
            localWarnings.push(`Row ${rowNum}: Duplicate passport "${passport}"`);
            continue;
          }
          passportSet.add(passport);

          validRows.push({
            fullName: fullName.trim(),
            passportNo: passport,
            nationality: nationality.trim(),
            dateOfBirth: dateOfBirth.trim(),
            gender: gender.trim(),
            visaNumber: visaNumber.trim(),
            vaccinationStatus: vaccinationStatus.trim().toLowerCase() === "yes" ? "Yes" : "No",
          });
        }

        if (validRows.length > remainingSlots) {
          localErrors.push(`Too many pilgrims: ${validRows.length} valid rows but only ${remainingSlots} remaining slot(s)`);
        }

        setCsvErrors(localErrors);
        setCsvWarnings(localWarnings);
        setCsvData(validRows);
      },
      error: (err) => {
        setCsvErrors([`CSV parse error: ${err.message}`]);
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!csvData || csvData.length === 0) return;
    if (csvData.length > remainingSlots) return;
    uploadMutation.mutate(csvData);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-guest-management-title">{t("bookings.guestManagement")}</DialogTitle>
          <DialogDescription>
            {roomType} booking - {booking.roomCount} room(s) x {capacity} {t("bookings.guests")} = {maxPilgrims} {t("bookings.totalGuestsRequired")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <div className="text-2xl font-bold" data-testid="text-max-pilgrims">{maxPilgrims}</div>
                <div className="text-xs text-muted-foreground">{t("bookings.required")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <div className="text-2xl font-bold" data-testid="text-registered-pilgrims">{registeredPilgrims}</div>
                <div className="text-xs text-muted-foreground">{t("bookings.registered")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <div className="text-2xl font-bold" data-testid="text-remaining-slots">{remainingSlots}</div>
                <div className="text-xs text-muted-foreground">{t("bookings.remaining")}</div>
              </CardContent>
            </Card>
          </div>

          {remainingSlots > 0 && !showAddForm && (
            <Button
              className="w-full bg-gold text-gold-foreground border-gold gold-glow"
              onClick={() => setShowAddForm(true)}
              data-testid="button-add-pilgrim-inline"
            >
              <UserPlus className="w-4 h-4 me-2" />
              {t("bookings.addPilgrim")} ({remainingSlots} {t("bookings.remaining")})
            </Button>
          )}

          {showAddForm && (
            <div className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  {t("bookings.addPilgrim")}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} data-testid="button-cancel-add-pilgrim">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">{t("bookings.name")} *</Label>
                  <Input value={addFullName} onChange={(e) => setAddFullName(e.target.value)} placeholder="Full name as on passport" data-testid="input-add-fullname" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("bookings.passport")} *</Label>
                  <Input value={addPassportNo} onChange={(e) => setAddPassportNo(e.target.value)} placeholder="e.g. AB1234567" data-testid="input-add-passport" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("bookings.nationality")} *</Label>
                  <Input value={addNationality} onChange={(e) => setAddNationality(e.target.value)} placeholder="e.g. SAU, EGY, PAK" data-testid="input-add-nationality" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("bookings.dateOfBirth")}</Label>
                  <Input type="date" value={addDateOfBirth} onChange={(e) => setAddDateOfBirth(e.target.value)} data-testid="input-add-dob" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("bookings.passportExpiry")}</Label>
                  <Input type="date" value={addPassportExpiry} onChange={(e) => setAddPassportExpiry(e.target.value)} data-testid="input-add-passport-expiry" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("bookings.gender")} *</Label>
                  <select
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="select-add-gender"
                  >
                    <option value="">{t("bookings.selectGender")}</option>
                    <option value="Male">{t("bookings.male")}</option>
                    <option value="Female">{t("bookings.female")}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={addVaccinated} onChange={(e) => setAddVaccinated(e.target.checked)} className="rounded" data-testid="input-add-vaccinated" />
                  <Label className="text-xs text-muted-foreground">{t("bookings.vaccinated")}</Label>
                </div>
              </div>
              <Button
                className="w-full bg-gold text-gold-foreground border-gold gold-glow"
                onClick={() => addPilgrimMutation.mutate()}
                disabled={!addFullName || !addPassportNo || !addNationality || !addGender || addPilgrimMutation.isPending}
                data-testid="button-submit-add-pilgrim"
              >
                {addPilgrimMutation.isPending ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <UserPlus className="w-4 h-4 me-2" />}
                {t("bookings.addPilgrim")}
              </Button>
            </div>
          )}

          <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{t("bookings.csvBulkUpload")}</h3>
              <Badge variant="secondary" className="text-xs">fullName, passportNo, nationality, dateOfBirth, gender, visaNumber, vaccinationStatus</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("bookings.csvUploadDesc")}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-csv-file"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-csv"
              >
                <Upload className="w-3.5 h-3.5 me-1" />
                {t("bookings.selectCsvFile")}
              </Button>
              {csvData && csvData.length > 0 && csvData.length <= remainingSlots && (
                <Button
                  size="sm"
                  className="bg-gold text-gold-foreground border-gold gold-glow"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-csv"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 me-1" />
                  )}
                  {t("bookings.upload")} {csvData.length} {t("bookings.pilgrims")}
                </Button>
              )}
            </div>

            {csvErrors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1" data-testid="csv-validation-errors">
                <div className="flex items-center gap-1 text-sm font-medium text-destructive">
                  <XCircle className="w-3.5 h-3.5" />
                  {t("bookings.validationErrors")}
                </div>
                {csvErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}

            {csvWarnings.length > 0 && (
              <div className="rounded-md border border-yellow-500/50 bg-yellow-500/5 p-3 space-y-1" data-testid="csv-validation-warnings">
                <div className="flex items-center gap-1 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("bookings.warnings")}
                </div>
                {csvWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">{w}</p>
                ))}
              </div>
            )}

            {csvData && csvData.length > 0 && (
              <div className="rounded-md border overflow-x-auto" data-testid="csv-preview-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t("bookings.name")}</TableHead>
                      <TableHead>{t("bookings.passport")}</TableHead>
                      <TableHead>{t("bookings.gender")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.fullName}</TableCell>
                        <TableCell>{row.passportNo}</TableCell>
                        <TableCell>{row.gender}</TableCell>
                      </TableRow>
                    ))}
                    {csvData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-xs">
                          ...and {csvData.length - 10} more
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {uploadResult && (
              <div className="rounded-md border border-green-500/50 bg-green-500/5 p-3" data-testid="csv-upload-result">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {uploadResult.message}
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResult.errors.map((e: string, i: number) => (
                      <p key={i} className="text-xs text-destructive">{e}</p>
                    ))}
                  </div>
                )}
                {uploadResult.warnings?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResult.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {booking.pilgrims && booking.pilgrims.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t("bookings.registeredGuests")} ({registeredPilgrims})</h3>
              <div className="space-y-2">
                {booking.pilgrims.map((p: any, i: number) => (
                  <PilgrimRow key={p.id} pilgrim={p} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PilgrimRow({ pilgrim, index }: { pilgrim: any; index: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pilgrim.fullName);
  const [editPassport, setEditPassport] = useState(pilgrim.passportNo);
  const [editNationality, setEditNationality] = useState(pilgrim.nationality || "");
  const [editDob, setEditDob] = useState(pilgrim.dateOfBirth || "");
  const [editGender, setEditGender] = useState(pilgrim.gender || "");
  const [editPassportExpiry, setEditPassportExpiry] = useState(pilgrim.passportExpiry || "");

  const editMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/pilgrims/${pilgrim.id}`, {
        fullName: editName,
        passportNo: editPassport,
        nationality: editNationality,
        dateOfBirth: editDob,
        gender: editGender,
        passportExpiry: editPassportExpiry,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: t("bookings.pilgrimUpdated") || "Pilgrim updated" });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/pilgrims/${pilgrim.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("bookings.pilgrimRemoved") || "Pilgrim removed" });
    },
    onError: (err: any) => {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    },
  });

  if (isEditing) {
    return (
      <div className="border rounded-md p-3 space-y-3 bg-background/60" data-testid={`pilgrim-edit-${pilgrim.id}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">#{index + 1} — {t("bookings.editPilgrim") || "Edit Pilgrim"}</span>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} data-testid={`button-cancel-edit-${pilgrim.id}`}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.name")}</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-name-${pilgrim.id}`} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.passport")}</Label>
            <Input value={editPassport} onChange={(e) => setEditPassport(e.target.value)} data-testid={`input-edit-passport-${pilgrim.id}`} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.nationality")}</Label>
            <Input value={editNationality} onChange={(e) => setEditNationality(e.target.value)} data-testid={`input-edit-nationality-${pilgrim.id}`} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.dateOfBirth")}</Label>
            <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} data-testid={`input-edit-dob-${pilgrim.id}`} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.passportExpiry")}</Label>
            <Input type="date" value={editPassportExpiry} onChange={(e) => setEditPassportExpiry(e.target.value)} data-testid={`input-edit-expiry-${pilgrim.id}`} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("bookings.gender")}</Label>
            <select
              value={editGender}
              onChange={(e) => setEditGender(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              data-testid={`select-edit-gender-${pilgrim.id}`}
            >
              <option value="Male">{t("bookings.male")}</option>
              <option value="Female">{t("bookings.female")}</option>
            </select>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full bg-gold text-gold-foreground border-gold gold-glow"
          onClick={() => editMutation.mutate()}
          disabled={!editName || !editPassport || editMutation.isPending}
          data-testid={`button-save-edit-${pilgrim.id}`}
        >
          {editMutation.isPending ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <Save className="w-3.5 h-3.5 me-1" />}
          {t("bookings.saveChanges") || "Save Changes"}
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors" data-testid={`pilgrim-row-${pilgrim.id}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{index + 1}</span>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{pilgrim.fullName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{pilgrim.passportNo}</span>
            {pilgrim.nationality && <span>· {pilgrim.nationality}</span>}
            {pilgrim.gender && <span>· {pilgrim.gender}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant={pilgrim.visaStatus === "APPROVED" ? "default" : pilgrim.visaStatus === "REJECTED" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {pilgrim.visaStatus}
        </Badge>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsEditing(true)} data-testid={`button-edit-pilgrim-${pilgrim.id}`}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => { if (confirm(t("bookings.confirmRemove") || "Remove this pilgrim?")) deleteMutation.mutate(); }}
          disabled={deleteMutation.isPending}
          data-testid={`button-delete-pilgrim-${pilgrim.id}`}
        >
          {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function AddPilgrimDialog({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [gender, setGender] = useState("");
  const [visaNumber, setVisaNumber] = useState("");
  const [vaccinated, setVaccinated] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/pilgrims", {
        bookingId,
        fullName,
        passportNo,
        nationality,
        dateOfBirth,
        passportExpiry,
        gender,
        visaNumber,
        vaccinationStatus: vaccinated ? "Yes" : "No",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: t("bookings.pilgrimRegistered") });
      setFullName("");
      setPassportNo("");
      setNationality("");
      setDateOfBirth("");
      setPassportExpiry("");
      setGender("");
      setVisaNumber("");
      setVaccinated(false);
      onClose();
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("bookings.registerPilgrim")}</DialogTitle>
          <DialogDescription>{t("bookings.addPilgrim")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("bookings.fullName")}</Label>
            <Input
              placeholder={t("bookings.fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              data-testid="input-pilgrim-name"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("bookings.passportNumber")}</Label>
            <Input
              placeholder={t("bookings.passportNumber")}
              value={passportNo}
              onChange={(e) => setPassportNo(e.target.value)}
              required
              data-testid="input-pilgrim-passport"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("bookings.nationality")}</Label>
            <Select value={nationality} onValueChange={setNationality}>
              <SelectTrigger data-testid="select-pilgrim-nationality">
                <SelectValue placeholder={t("bookings.selectNationality")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("bookings.dateOfBirth")}</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              data-testid="input-pilgrim-dob"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("public.passportExpiry")}</Label>
            <Input
              type="date"
              value={passportExpiry}
              onChange={(e) => setPassportExpiry(e.target.value)}
              required
              data-testid="input-pilgrim-passport-expiry"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("bookings.gender")}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger data-testid="select-pilgrim-gender">
                <SelectValue placeholder={t("bookings.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">{t("bookings.male")}</SelectItem>
                <SelectItem value="Female">{t("bookings.female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("bookings.visaNumber")}</Label>
            <Input
              placeholder={t("bookings.visaNumber")}
              value={visaNumber}
              onChange={(e) => setVisaNumber(e.target.value)}
              data-testid="input-pilgrim-visa"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vaccinated"
              checked={vaccinated}
              onCheckedChange={(checked) => setVaccinated(checked === true)}
              data-testid="checkbox-pilgrim-vaccination"
            />
            <Label htmlFor="vaccinated" className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {t("bookings.vaccinationStatus")} (Meningitis / COVID-19)
            </Label>
          </div>
          <Button type="submit" className="w-full bg-gold text-gold-foreground border-gold gold-glow" disabled={mutation.isPending} data-testid="button-submit-pilgrim">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("bookings.addPilgrim")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoicePdfDownloadButton({ bookingId }: { bookingId: string }) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/tax-invoice/${bookingId}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-invoice-${bookingId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("invoice.downloaded") });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={handleDownload} disabled={downloading} data-testid={`button-download-invoice-${bookingId}`}>
      {downloading ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 me-1" />}
      {t("invoice.downloadPdf")}
    </Button>
  );
}

function TaxInvoiceDialog({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { formatPrice, currency } = useCurrency();
  const { t } = useTranslation();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { toast } = useToast();
  const { data: invoice, isLoading } = useQuery<any>({
    queryKey: ["/api/tax-invoice", bookingId],
  });

  const showSARNote = currency !== "SAR" && invoice;

  const handlePdfDownload = async () => {
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/tax-invoice/${bookingId}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-invoice-${bookingId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("invoice.downloaded") });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-tax-invoice-title">{t("invoice.title")}</DialogTitle>
          <DialogDescription>{t("invoice.subtitle")}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : invoice ? (
          <div className="space-y-4" data-testid="tax-invoice-content">
            {invoice.qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-1">
                <img src={invoice.qrCodeDataUrl} alt="ZATCA QR Code" className="w-32 h-32" data-testid="img-invoice-qr" />
                <span className="text-[10px] text-muted-foreground">{t("invoice.qrNote")}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-md p-3 space-y-1.5 bg-background/40">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("invoice.seller")}</p>
                <p className="text-sm font-semibold text-foreground" data-testid="text-seller-name">{invoice.sellerName}</p>
                <p className="text-xs text-muted-foreground">{t("invoice.vatNo")}: <span className="font-mono" data-testid="text-seller-vat">{invoice.sellerVat}</span></p>
                {invoice.ministryBrn && (
                  <p className="text-xs text-muted-foreground">BRN: <span className="font-mono">{invoice.ministryBrn}</span></p>
                )}
              </div>
              <div className="border rounded-md p-3 space-y-1.5 bg-background/40">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("invoice.buyer")}</p>
                <p className="text-sm font-semibold text-foreground" data-testid="text-buyer-name">{invoice.buyerName}</p>
                <p className="text-xs text-muted-foreground">{t("invoice.vatNo")}: <span className="font-mono" data-testid="text-buyer-vat">{invoice.buyerVat}</span></p>
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.invoiceNo")}</span>
                <span className="font-mono font-semibold" data-testid="text-invoice-number">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.date")}</span>
                <span>{new Date(invoice.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.roomType")}</span>
                <span>{invoice.roomType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.rooms")}</span>
                <span>{invoice.roomCount}</span>
              </div>
            </div>
            <div className="border rounded-md p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.pricePerRoom")}</span>
                <span className="font-mono tabular-nums">{formatPrice(invoice.pricePerRoom)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.subtotal")}</span>
                <span className="font-mono tabular-nums">{formatPrice(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.vat")} ({invoice.vatRate})</span>
                <span className="font-mono tabular-nums">{formatPrice(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>{t("invoice.total")}</span>
                <span className="font-mono tabular-nums price-glow" data-testid="text-invoice-total">{formatPrice(invoice.totalWithVat)}</span>
              </div>
            </div>
            {showSARNote && (
              <div className="border border-amber-500/50 rounded-md p-3 bg-amber-500/5" data-testid="sar-note">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">{t("bookings.officialSARTotal")}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("invoice.subtotal")}</span>
                    <span className="font-mono">{formatPrice(invoice.subtotalSAR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("invoice.vat")} (15%)</span>
                    <span className="font-mono">{formatPrice(invoice.vatAmountSAR)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t("invoice.total")}</span>
                    <span className="font-mono">{formatPrice(invoice.totalWithVatSAR)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("invoice.currency")}: {invoice.currency}</span>
                <Badge variant={invoice.status === "CONFIRMED" ? "default" : "secondary"}>{invoice.status}</Badge>
              </div>
              <Button size="sm" variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={handlePdfDownload} disabled={downloadingPdf} data-testid={`button-download-invoice-pdf-${bookingId}`}>
                {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 me-1" />}
                {t("invoice.downloadPdf")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4">{t("invoice.notAvailable")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
