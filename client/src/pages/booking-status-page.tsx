import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, CheckCircle, Clock, ShieldCheck, AlertTriangle, Loader2,
  User, Building2, Plane, Download
} from "lucide-react";
import { PHXLogo } from "@/components/phx-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicCurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/lib/i18n";

function ProgressStep({ done, label, detail, isLast }: { done: boolean; label: string; detail: string; isLast: boolean }) {
  return (
    <div className="flex gap-3" data-testid={`step-${done ? "done" : "pending"}-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500/20 border-2 border-emerald-500" : "bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600"}`}>
          {done ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-8 ${done ? "bg-emerald-500/40" : "bg-slate-300 dark:bg-slate-600"}`} />
        )}
      </div>
      <div className="pb-6">
        <p className={`text-sm font-medium ${done ? "text-emerald-400" : "text-gray-900 dark:text-white"}`}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  const { t } = useTranslation();
  const [bookingRef, setBookingRef] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleLookup = async () => {
    setError("");
    setResult(null);
    setSearched(false);

    if (!bookingRef.trim() || !passportNumber.trim()) {
      setError(t("bookingStatus.bothRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/booking-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase(),
          passportNumber: passportNumber.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || t("bookingStatus.bookingNotFound"));
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleDownloadVoucher = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/booking-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: bookingRef.trim().toUpperCase(),
          passportNumber: passportNumber.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || t("bookingStatus.downloadFailed"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voucher-${bookingRef.trim().toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(t("bookingStatus.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col">
      <header className="bg-transparent border-b border-slate-200 dark:border-slate-700/50 px-3 sm:px-4 py-4 sm:py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37] shrink-0" />
            <div>
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">{t("bookingStatus.title")}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{t("bookingStatus.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PublicCurrencyToggle />
            <LanguageSwitcher />
            <ThemeToggle />
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-2 sm:px-3 py-1 hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("bookingStatus.secureLookup")}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full">
        <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="text-center pb-2">
              <h2 className="text-gray-900 dark:text-white font-semibold text-lg" data-testid="text-lookup-heading">{t("bookingStatus.lookUpBooking")}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t("bookingStatus.lookUpDesc")}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2.5" data-testid="text-lookup-error">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-600 dark:text-slate-300 text-sm">{t("bookingStatus.voucherId")}</Label>
                <Input
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                  className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white font-mono tracking-wider focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                  placeholder="PHX-2026-00001"
                  data-testid="input-booking-ref"
                />
                <p className="text-xs text-slate-500">{t("bookingStatus.voucherIdHint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 dark:text-slate-300 text-sm">{t("bookingStatus.passportNumber")}</Label>
                <Input
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                  placeholder="A12345678"
                  data-testid="input-passport-lookup"
                />
                <p className="text-xs text-slate-500">{t("bookingStatus.passportHint")}</p>
              </div>

              <Button
                onClick={handleLookup}
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold h-11 shadow-lg shadow-[#D4AF37]/10"
                data-testid="button-lookup"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                {t("bookingStatus.checkStatus")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && !error && result && (
          <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 mt-6" data-testid="card-booking-result">
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  {t("bookingStatus.bookingFound")}
                </h3>
                <Badge className={`${result.status === "CONFIRMED" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"} font-semibold`}>
                  {result.status}
                </Badge>
              </div>

              <div className="bg-[#D4AF37]/5 border-2 border-[#D4AF37]/30 rounded-xl p-4 sm:p-5 text-center">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest mb-1.5 font-medium">{t("bookingStatus.accommodationVoucherId")}</p>
                <code className="text-xl sm:text-2xl text-[#D4AF37] font-mono font-bold tracking-wider" data-testid="text-result-ref">
                  {result.bookingRef}
                </code>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                  <User className="w-4 h-4" />
                  <p className="text-xs uppercase tracking-wider font-medium">{t("bookingStatus.guestDetails")}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.fullName")}</p>
                    <p className="text-gray-900 dark:text-white font-medium text-sm mt-0.5" data-testid="text-result-name">{result.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.citizenship")}</p>
                    <p className="text-gray-900 dark:text-white text-sm mt-0.5">{result.citizenship}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.roomsBooked")}</p>
                    <p className="text-gray-900 dark:text-white text-sm mt-0.5">{result.roomCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                  <Building2 className="w-4 h-4" />
                  <p className="text-xs uppercase tracking-wider font-medium">{t("bookingStatus.accommodation")}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.hotel")}</p>
                    <p className="text-gray-900 dark:text-white font-medium text-sm mt-0.5" data-testid="text-result-hotel">{result.hotelName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.roomType")}</p>
                    <p className="text-gray-900 dark:text-white text-sm mt-0.5">{result.roomType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("bookingStatus.city")}</p>
                    <p className="text-gray-900 dark:text-white text-sm mt-0.5">{result.city}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Plane className="w-4 h-4" />
                  <p className="text-xs uppercase tracking-wider font-medium">{t("bookingStatus.visaStatus")}</p>
                  <Badge
                    className={`ms-auto font-semibold text-xs px-2.5 py-0.5 ${result.visaStatus === "ISSUED" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}
                    data-testid="badge-visa-status"
                  >
                    {result.visaStatus}
                  </Badge>
                </div>

                <div className="space-y-0">
                  <ProgressStep
                    done={true}
                    label={t("bookingStatus.stepBooked")}
                    detail={t("bookingStatus.stepBookedDetail")}
                    isLast={false}
                  />
                  <ProgressStep
                    done={!!result.nusukSynced}
                    label={t("bookingStatus.stepSubmitted")}
                    detail={result.nusukSynced
                      ? `${t("bookingStatus.stepSubmittedDetail")} ${new Date(result.nusukSyncedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                      : t("bookingStatus.stepSubmittedPending")}
                    isLast={false}
                  />
                  <ProgressStep
                    done={result.visaStatus === "ISSUED"}
                    label={t("bookingStatus.stepVisa")}
                    detail={result.visaStatus === "ISSUED"
                      ? `${t("bookingStatus.stepVisaDetail")} ${result.visaNumber}`
                      : t("bookingStatus.stepVisaPending")}
                    isLast={true}
                  />
                </div>
              </div>

              {result.visaStatus === "ISSUED" && result.visaNumber && (
                <div className="space-y-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-[10px] sm:text-xs text-emerald-400/70 uppercase tracking-widest mb-1 font-medium">{t("bookingStatus.visaNumber")}</p>
                    <code className="text-lg sm:text-xl text-emerald-400 font-mono font-bold tracking-wider" data-testid="text-visa-number">
                      {result.visaNumber}
                    </code>
                  </div>
                  <Button
                    onClick={handleDownloadVoucher}
                    disabled={downloading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 shadow-lg"
                    data-testid="button-download-voucher"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    {t("bookingStatus.downloadVoucher")}
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {searched && !error && !result && (
          <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 mt-6">
            <CardContent className="flex flex-col items-center py-12">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">{t("bookingStatus.noBookingFound")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">{t("bookingStatus.noBookingFoundDesc")}</p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-white dark:bg-[#1C2530] border-t border-slate-200 dark:border-slate-700/50 py-5 mt-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <PHXLogo size={20} glow={false} />
            <span>{t("bookingStatus.poweredBy")} <span className="text-slate-600 dark:text-slate-400 font-medium">PHX Exchange</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>{t("bookingStatus.secureLookupFooter")}</span>
            <span>•</span>
            <span>{t("bookingStatus.zatcaCompliant")}</span>
            <span>•</span>
            <span>{t("bookingStatus.escrowProtected")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}