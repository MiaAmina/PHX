import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Building2, MapPin, Calendar, Bed, CheckCircle, Loader2, AlertTriangle,
  ShieldCheck, Star, Footprints, CreditCard, User, FileText, Users,
  Plus, Trash2, Upload, Download, ArrowRight, ArrowLeft, CheckCircle2, Search
} from "lucide-react";
import { PHXLogo } from "@/components/phx-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicCurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import hotelPlaceholderImg from "@assets/hotel-placeholder.png";

const COUNTRIES = [
  { code: "SAU", name: "Saudi Arabia" }, { code: "EGY", name: "Egypt" }, { code: "PAK", name: "Pakistan" },
  { code: "IDN", name: "Indonesia" }, { code: "IND", name: "India" }, { code: "BGD", name: "Bangladesh" },
  { code: "TUR", name: "Turkey" }, { code: "MYS", name: "Malaysia" }, { code: "IRN", name: "Iran" },
  { code: "IRQ", name: "Iraq" }, { code: "JOR", name: "Jordan" }, { code: "SYR", name: "Syria" },
  { code: "YEM", name: "Yemen" }, { code: "SDN", name: "Sudan" }, { code: "MAR", name: "Morocco" },
  { code: "DZA", name: "Algeria" }, { code: "TUN", name: "Tunisia" }, { code: "LBY", name: "Libya" },
  { code: "NGA", name: "Nigeria" }, { code: "SOM", name: "Somalia" }, { code: "AFG", name: "Afghanistan" },
  { code: "GBR", name: "United Kingdom" }, { code: "USA", name: "United States" }, { code: "DEU", name: "Germany" },
  { code: "FRA", name: "France" }, { code: "ARE", name: "UAE" }, { code: "KWT", name: "Kuwait" },
  { code: "BHR", name: "Bahrain" }, { code: "QAT", name: "Qatar" }, { code: "OMN", name: "Oman" },
  { code: "LBN", name: "Lebanon" }, { code: "PSE", name: "Palestine" }, { code: "LKA", name: "Sri Lanka" },
  { code: "PHL", name: "Philippines" }, { code: "ETH", name: "Ethiopia" }, { code: "KEN", name: "Kenya" },
  { code: "TZA", name: "Tanzania" }, { code: "UGA", name: "Uganda" }, { code: "SEN", name: "Senegal" },
  { code: "MLI", name: "Mali" }, { code: "NER", name: "Niger" }, { code: "TCD", name: "Chad" },
  { code: "CMR", name: "Cameroon" }, { code: "GHA", name: "Ghana" }, { code: "CIV", name: "Côte d'Ivoire" },
].sort((a, b) => a.name.localeCompare(b.name));

export default function PublicStorefrontPage() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [, params] = useRoute("/s/:slug");
  const slug = params?.slug || "";

  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingMode, setBookingMode] = useState<"individual" | "group">("individual");

  const [fullName, setFullName] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [dob, setDob] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [nusukId, setNusukId] = useState("");
  const [roomCount, setRoomCount] = useState(1);
  const [formError, setFormError] = useState("");

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupStep, setGroupStep] = useState<1 | 2>(1);
  const [groupLeaderName, setGroupLeaderName] = useState("");
  const [groupLeaderPhone, setGroupLeaderPhone] = useState("");
  const [groupLeaderEmail, setGroupLeaderEmail] = useState("");
  const [groupRoomCount, setGroupRoomCount] = useState(2);
  const [groupRoomCountInput, setGroupRoomCountInput] = useState("2");
  const [groupPilgrims, setGroupPilgrims] = useState<Array<{
    fullName: string; citizenship: string; passportNumber: string;
    dob: string; passportExpiry: string; nusukId: string; roomCount: number;
  }>>([]);
  const [groupError, setGroupError] = useState("");
  const [gpFullName, setGpFullName] = useState("");
  const [gpCitizenship, setGpCitizenship] = useState("");
  const [gpPassport, setGpPassport] = useState("");
  const [gpDob, setGpDob] = useState("");
  const [gpExpiry, setGpExpiry] = useState("");
  const [gpNusukId, setGpNusukId] = useState("");
  const [gpRoomCount, setGpRoomCount] = useState(1);
  const [groupConfirmationOpen, setGroupConfirmationOpen] = useState(false);
  const [groupBookingResults, setGroupBookingResults] = useState<any[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const { data: storefrontData, isLoading, error } = useQuery<any>({
    queryKey: ["/api/s", slug],
    queryFn: async () => {
      const res = await fetch(`/api/s/${slug}`);
      if (!res.ok) throw new Error(t("public.storefrontNotFoundError"));
      return res.json();
    },
    enabled: !!slug,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/s/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (result) => {
      setBookingResult(result);
      setFormOpen(false);
      setConfirmationOpen(true);
      setFullName("");
      setCitizenship("");
      setPassportNumber("");
      setDob("");
      setPassportExpiry("");
      setNusukId("");
      setRoomCount(1);
    },
    onError: (err: any) => {
      setFormError(err.message);
    },
  });

  const groupBookMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/s/${slug}/book-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (results) => {
      setGroupBookingResults(results.bookings);
      setGroupFormOpen(false);
      setGroupConfirmationOpen(true);
      resetGroupForm();
    },
    onError: (err: any) => {
      setGroupError(err.message);
    },
  });

  const resetGroupForm = () => {
    setGroupStep(1);
    setGroupLeaderName("");
    setGroupLeaderPhone("");
    setGroupLeaderEmail("");
    setGroupRoomCount(2);
    setGroupRoomCountInput("2");
    setGroupPilgrims([]);
    setGroupError("");
    resetPilgrimFields();
  };

  const resetPilgrimFields = () => {
    setGpFullName("");
    setGpCitizenship("");
    setGpPassport("");
    setGpDob("");
    setGpExpiry("");
    setGpNusukId("");
    setGpRoomCount(1);
  };

  const totalAssignedRooms = groupPilgrims.reduce((sum, p) => sum + p.roomCount, 0);
  const remainingRooms = groupRoomCount - totalAssignedRooms;

  const addPilgrimToGroup = () => {
    setGroupError("");
    if (!gpFullName || !gpCitizenship || !gpPassport || !gpDob || !gpExpiry || !gpNusukId) {
      setGroupError(t("public.allFieldsRequired"));
      return;
    }
    if (!/^\d{10}$/.test(gpNusukId)) {
      setGroupError(t("public.invalidNusukId"));
      return;
    }
    const expiryDate = new Date(gpExpiry);
    if (expiryDate <= new Date()) {
      setGroupError(t("public.passportExpired"));
      return;
    }
    if (gpRoomCount > remainingRooms) {
      setGroupError(`${remainingRooms} ${t("public.roomsRemaining")}`);
      return;
    }
    if (groupPilgrims.some(p => p.passportNumber === gpPassport)) {
      setGroupError(t("public.duplicatePassport"));
      return;
    }
    setGroupPilgrims([...groupPilgrims, {
      fullName: gpFullName, citizenship: gpCitizenship, passportNumber: gpPassport,
      dob: gpDob, passportExpiry: gpExpiry, nusukId: gpNusukId, roomCount: gpRoomCount,
    }]);
    resetPilgrimFields();
  };

  const removePilgrimFromGroup = (index: number) => {
    setGroupPilgrims(groupPilgrims.filter((_, i) => i !== index));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setGroupError(t("public.csvHeaderRequired"));
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const nameIdx = headers.findIndex(h => ['fullname', 'full_name', 'name'].includes(h));
      const citizenIdx = headers.findIndex(h => ['citizenship', 'nationality', 'country'].includes(h));
      const passportIdx = headers.findIndex(h => ['passportnumber', 'passport_number', 'passport', 'passport_no'].includes(h));
      const dobIdx = headers.findIndex(h => ['dob', 'date_of_birth', 'dateofbirth', 'birthdate'].includes(h));
      const expiryIdx = headers.findIndex(h => ['passportexpiry', 'passport_expiry', 'expiry', 'expiry_date'].includes(h));
      const nusukIdx = headers.findIndex(h => ['nusukid', 'nusuk_id', 'nusuk'].includes(h));
      const roomIdx = headers.findIndex(h => ['roomcount', 'room_count', 'rooms'].includes(h));

      if (nameIdx === -1 || citizenIdx === -1 || passportIdx === -1 || dobIdx === -1 || expiryIdx === -1 || nusukIdx === -1) {
        setGroupError(t("public.csvMissingColumns"));
        return;
      }

      const newPilgrims: typeof groupPilgrims = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
        const name = cols[nameIdx];
        const citizen = cols[citizenIdx];
        const passport = cols[passportIdx];
        const birthDate = cols[dobIdx];
        const expiry = cols[expiryIdx];
        const nusuk = cols[nusukIdx];
        const rooms = roomIdx !== -1 ? parseInt(cols[roomIdx]) || 1 : 1;

        if (!name || !citizen || !passport || !birthDate || !expiry || !nusuk) {
          errors.push(`${t("public.row")} ${i}: ${t("public.csvRowMissing")}`);
          continue;
        }
        if (!/^\d{10}$/.test(nusuk)) {
          errors.push(`${t("public.row")} ${i} (${name}): ${t("public.csvRowInvalidNusuk")}`);
          continue;
        }
        if (new Date(expiry) <= new Date()) {
          errors.push(`${t("public.row")} ${i} (${name}): ${t("public.csvRowPassportExpired")}`);
          continue;
        }
        newPilgrims.push({ fullName: name, citizenship: citizen, passportNumber: passport, dob: birthDate, passportExpiry: expiry, nusukId: nusuk, roomCount: rooms });
      }

      if (errors.length > 0) {
        setGroupError(errors.join("; "));
        return;
      }

      const totalRooms = newPilgrims.reduce((s, p) => s + p.roomCount, 0) + totalAssignedRooms;
      if (totalRooms > groupRoomCount) {
        setGroupError(`${t("public.csvContains")} ${totalRooms - totalAssignedRooms} ${t("public.csvRoomsTooMany")} ${remainingRooms} ${t("public.remaining")}`);
        return;
      }

      setGroupPilgrims([...groupPilgrims, ...newPilgrims]);
      setGroupError("");
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const downloadCsvTemplate = () => {
    const csv = "fullName,citizenship,passportNumber,dob,passportExpiry,nusukId,roomCount\nMohammed Al-Farsi,SAU,SA1234567,1985-03-15,2028-06-20,1234567890,1\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pilgrim_group_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitGroupBooking = () => {
    setGroupError("");
    if (groupPilgrims.length === 0) {
      setGroupError(t("public.addAtLeastOnePilgrim"));
      return;
    }
    if (totalAssignedRooms > groupRoomCount) {
      setGroupError(t("public.roomsExceedRequested"));
      return;
    }
    groupBookMutation.mutate({
      blockId: selectedBlock.blockId,
      leaderName: groupLeaderName,
      leaderPhone: groupLeaderPhone,
      leaderEmail: groupLeaderEmail,
      pilgrims: groupPilgrims,
      groupRoomCount,
    });
  };

  const validateAndSubmit = () => {
    setFormError("");

    if (!fullName || !citizenship || !passportNumber || !dob || !passportExpiry || !nusukId) {
      setFormError(t("public.allFieldsRequired"));
      return;
    }

    if (!/^\d{10}$/.test(nusukId)) {
      setFormError(t("public.invalidNusukId"));
      return;
    }

    const expiryDate = new Date(passportExpiry);
    if (expiryDate <= new Date()) {
      setFormError(t("public.passportExpired"));
      return;
    }

    bookMutation.mutate({
      blockId: selectedBlock.blockId,
      fullName,
      citizenship,
      passportNumber,
      dob,
      passportExpiry,
      nusukId,
      roomCount,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
        <p className="text-slate-400 text-sm">{t("public.loadingStorefront")}</p>
      </div>
    );
  }

  if (error || !storefrontData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center p-4">
        <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center py-16">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
              <AlertTriangle className="h-12 w-12 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("public.storefrontNotFound")}</h2>
            <p className="text-slate-400 text-center text-sm max-w-xs">{t("public.storefrontNotFoundDesc")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = roomCount > 0 && selectedBlock ? roomCount * parseFloat(selectedBlock.pricePerNight) : 0;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col">
      <header className="bg-transparent border-b border-slate-200 dark:border-slate-700/50 px-3 sm:px-4 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate" data-testid="text-agency-name">{storefrontData.agencyName}</h1>
              {storefrontData.agencyDescription && (
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm line-clamp-1">{storefrontData.agencyDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <PublicCurrencyToggle />
            <ThemeToggle />
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-2 sm:px-3 py-1 sm:py-1.5 hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("public.verifiedAgent")}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2" data-testid="text-available-rooms">
            <Bed className="w-5 h-5 text-[#D4AF37]" />
            {t("public.availableRooms")}
          </h2>
          <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs sm:text-sm">
            {storefrontData.listings.length} {storefrontData.listings.length !== 1 ? t("public.listings") : t("public.listing")}
          </Badge>
        </div>

        {storefrontData.listings.length === 0 ? (
          <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700">
            <CardContent className="flex flex-col items-center py-16">
              <div className="p-4 rounded-2xl bg-slate-800/50 mb-4">
                <Bed className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">{t("public.noRoomsAvailable")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("public.noRoomsCheckBack")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {storefrontData.listings.map((listing: any) => (
              <Card
                key={listing.blockId}
                className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/60 hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-200 group"
                data-testid={`card-room-${listing.blockId}`}
              >
                <div className="w-full h-32 overflow-hidden rounded-t-lg">
                  <img
                    src={listing.hotelImageUrl || hotelPlaceholderImg}
                    alt={listing.hotelName}
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = hotelPlaceholderImg; }}
                  />
                </div>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-gray-900 dark:text-white text-base sm:text-lg font-bold truncate" data-testid={`text-hotel-${listing.blockId}`}>{listing.hotelName}</h3>
                      <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{listing.city}</span>
                        {listing.checkIn && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{new Date(listing.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {listing.checkOut ? new Date(listing.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {listing.availableRooms > 0 ? (
                      <Badge className="bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30 shrink-0 text-xs font-semibold px-2 py-0.5">
                        {listing.availableRooms} {t("public.left")}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 shrink-0 text-xs font-semibold px-2 py-0.5">
                        {t("public.soldOut") || "Sold Out"}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-600 text-xs px-2 py-0.5">
                      <Bed className="h-3 w-3 mr-1" />
                      {listing.roomType}
                    </Badge>
                    {listing.distanceFromHaram && (
                      <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/25 text-xs px-2 py-0.5">
                        <Footprints className="h-3 w-3 mr-1" />
                        {listing.distanceFromHaram}m
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-0.5">{t("public.pricePerRoomNight")}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tracking-tight" data-testid={`text-price-${listing.blockId}`}>
                          {formatPrice(listing.pricePerNight)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{t("public.plusVat")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 relative z-10">
                    {listing.availableRooms > 0 ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => { setSelectedBlock(listing); setFormOpen(true); setFormError(""); setRoomCount(1); }}
                          className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold h-10 text-xs sm:text-sm shadow-sm"
                          data-testid={`button-book-${listing.blockId}`}
                        >
                          <User className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          <span className="truncate">{t("public.individual")}</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => { setSelectedBlock(listing); setGroupFormOpen(true); setGroupError(""); setGroupStep(1); setGroupRoomCount(2); setGroupRoomCountInput("2"); setGroupPilgrims([]); }}
                          variant="outline"
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 font-semibold h-10 text-xs sm:text-sm"
                          data-testid={`button-group-book-${listing.blockId}`}
                        >
                          <Users className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          <span className="truncate">{t("public.group")}</span>
                        </Button>
                      </>
                    ) : (
                      <div className="col-span-2 text-center py-2">
                        <p className="text-red-400 text-sm font-medium">{t("public.soldOut") || "Sold Out"}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{t("public.noRoomsCheckBack") || "Check back later for availability"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <div className="flex items-center gap-2 pr-10">
                <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                  {t("public.bookRoom")}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {selectedBlock?.hotelName} — {selectedBlock?.roomType}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="space-y-5 pt-1">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2.5" data-testid="text-form-error">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedBlock?.hotelName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedBlock?.roomType} — {selectedBlock?.city}</p>
                </div>
                <p className="text-xl font-bold text-[#D4AF37]">{formatPrice(selectedBlock?.pricePerNight || "0")}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.numberOfRooms")}</Label>
              <Input
                type="number"
                value={roomCount}
                onChange={(e) => setRoomCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedBlock?.availableRooms || 1)))}
                className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                min="1"
                max={selectedBlock?.availableRooms || 1}
                data-testid="input-room-count"
              />
              <p className="text-xs text-slate-500">{selectedBlock?.availableRooms} {t("public.roomsAvailable")}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4" />
                <p className="text-xs uppercase tracking-wider font-medium">{t("public.personalInfo")}</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.fullNamePassport")}</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    placeholder="Mohammed Ahmed Al-Farsi"
                    data-testid="input-full-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.citizenship")}</Label>
                  <Select value={citizenship} onValueChange={setCitizenship}>
                    <SelectTrigger className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white" data-testid="select-citizenship">
                      <SelectValue placeholder={t("public.selectCountry")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1E293B] border-slate-300 dark:border-slate-600 max-h-[200px]">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.dateOfBirth")}</Label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    data-testid="input-dob"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <FileText className="w-4 h-4" />
                <p className="text-xs uppercase tracking-wider font-medium">{t("public.travelDocuments")}</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.passportNumber")}</Label>
                  <Input
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    placeholder="A12345678"
                    data-testid="input-passport"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.passportExpiry")}</Label>
                  <Input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    data-testid="input-passport-expiry"
                  />
                  <p className="text-xs text-slate-500">{t("public.passportExpiryHint")}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.nusukId")}</Label>
                  <Input
                    value={nusukId}
                    onChange={(e) => setNusukId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                    placeholder="1234567890"
                    maxLength={10}
                    data-testid="input-nusuk-id"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{t("public.nusukIdHint")}</p>
                    <p className={`text-xs font-mono ${nusukId.length === 10 ? "text-emerald-400" : "text-slate-500"}`}>{nusukId.length}/10</p>
                  </div>
                </div>
              </div>
            </div>

            {subtotal > 0 && (
              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">{t("public.orderSummary")}</p>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                  <span>{roomCount} {roomCount > 1 ? t("public.rooms") : t("public.room")} × {formatPrice(selectedBlock?.pricePerNight || "0")}</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                  <span>{t("public.vat15")}</span>
                  <span>{formatPrice(vat)}</span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white font-bold pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                  <span>{t("public.total")}</span>
                  <span className="text-[#D4AF37] text-lg">{formatPrice(total)}</span>
                </div>
              </div>
            )}

          </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 pt-4 shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="flex-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                data-testid="button-cancel-booking"
              >
                {t("public.back") || "Back"}
              </Button>
              <Button
                onClick={validateAndSubmit}
                disabled={bookMutation.isPending}
                className="flex-[2] bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold py-3 shadow-lg shadow-[#D4AF37]/10"
                data-testid="button-submit-booking"
              >
                {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {t("public.confirmBooking")} — {formatPrice(total)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 max-w-[95vw] sm:max-w-md">
          <div className="flex flex-col items-center py-8 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-booking-confirmed">{t("public.bookingConfirmed")}</h2>
              <p className="text-slate-400 text-sm mt-1.5">{t("public.bookingConfirmedDesc")}</p>
            </div>
            {bookingResult && (
              <div className="w-full space-y-4">
                <div className="bg-[#D4AF37]/5 border-2 border-[#D4AF37]/30 rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-medium">{t("public.officialVoucherId")}</p>
                  <code className="text-2xl text-[#D4AF37] font-mono font-bold tracking-wider" data-testid="text-booking-ref">
                    {bookingResult.bookingRef}
                  </code>
                  <p className="text-xs text-slate-500 mt-2">{t("public.presentForVisa")}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-5 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">{t("public.guest")}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{bookingResult.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">{t("public.rooms")}</span>
                    <span className="text-gray-900 dark:text-white">{bookingResult.roomCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">{t("public.nusukId")}</span>
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{bookingResult.nusukId}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t("public.totalInclVat")}</span>
                    <span className="text-[#D4AF37] font-bold text-lg">{formatPrice(bookingResult.totalWithVat)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 justify-center">
                <Search className="w-4 h-4 text-blue-400" />
                <p className="text-gray-900 dark:text-white text-sm font-semibold">{t("public.trackVisaTitle")}</p>
              </div>
              <p className="text-slate-400 text-xs text-center">{t("public.trackVisaDesc")}</p>
              <a
                href="/booking-status"
                className="block w-full text-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium text-sm py-2.5 rounded-lg border border-blue-500/30 transition-colors"
                data-testid="link-check-visa-status"
              >
                {t("public.goToBookingStatus")} →
              </a>
            </div>
            <Button
              onClick={() => setConfirmationOpen(false)}
              className="bg-[#D4AF37] hover:bg-[#C4A030] text-black w-full font-semibold"
              data-testid="button-close-confirmation"
            >
              {t("public.done")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupFormOpen} onOpenChange={(open) => { setGroupFormOpen(open); if (!open) resetGroupForm(); }}>
        <DialogContent className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <div className="p-6 pb-3">
            <DialogHeader>
              <div className="flex items-center gap-2 pr-10">
                <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
                  {t("public.groupBooking")} {groupStep === 1 ? `— ${t("public.leaderInfo")}` : `— ${t("public.pilgrimDetails")}`}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {selectedBlock?.hotelName} — {selectedBlock?.roomType}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6">

          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${groupStep >= 1 ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
              <span className="w-5 h-5 rounded-full bg-[#D4AF37]/30 flex items-center justify-center text-[10px] font-bold">1</span>
              {t("public.leaderInfo")}
            </div>
            <div className="w-6 h-px bg-slate-300 dark:bg-slate-700" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${groupStep >= 2 ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${groupStep >= 2 ? "bg-[#D4AF37]/30" : "bg-slate-200 dark:bg-slate-700"}`}>2</span>
              {t("public.pilgrimDetails")}
            </div>
          </div>

          {groupError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2.5" data-testid="text-group-error">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{groupError}</span>
            </div>
          )}

          {groupStep === 1 && (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedBlock?.hotelName}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedBlock?.roomType} — {selectedBlock?.city}</p>
                  </div>
                  <p className="text-xl font-bold text-[#D4AF37]">{formatPrice(selectedBlock?.pricePerNight || "0")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <User className="w-4 h-4" />
                  <p className="text-xs uppercase tracking-wider font-medium">{t("public.groupLeaderContact")}</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.leaderFullName")}</Label>
                    <Input
                      value={groupLeaderName}
                      onChange={(e) => setGroupLeaderName(e.target.value)}
                      className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                      placeholder="Group organizer name"
                      data-testid="input-group-leader-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.phoneNumber")}</Label>
                      <Input
                        value={groupLeaderPhone}
                        onChange={(e) => setGroupLeaderPhone(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        placeholder="+966 5XX XXX XXXX"
                        data-testid="input-group-leader-phone"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.emailAddress")}</Label>
                      <Input
                        type="email"
                        value={groupLeaderEmail}
                        onChange={(e) => setGroupLeaderEmail(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        placeholder="leader@email.com"
                        data-testid="input-group-leader-email"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 dark:text-slate-600 dark:text-slate-300 text-sm">{t("public.totalRoomsForGroup")}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={groupRoomCountInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setGroupRoomCountInput(raw);
                    const num = parseInt(raw);
                    if (!isNaN(num) && num > 0) {
                      setGroupRoomCount(Math.min(num, selectedBlock?.availableRooms || 999));
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(groupRoomCountInput);
                    if (isNaN(num) || num < 2) {
                      setGroupRoomCount(2);
                      setGroupRoomCountInput("2");
                    } else {
                      const clamped = Math.min(num, selectedBlock?.availableRooms || 999);
                      setGroupRoomCount(clamped);
                      setGroupRoomCountInput(String(clamped));
                    }
                  }}
                  className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                  data-testid="input-group-room-count"
                />
                <p className="text-xs text-slate-500">{selectedBlock?.availableRooms} {t("public.roomsAvailableMin2")}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGroupFormOpen(false)}
                  className="flex-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  data-testid="button-group-cancel"
                >
                  {t("public.back") || "Back"}
                </Button>
                <Button
                  onClick={() => {
                    setGroupError("");
                    if (!groupLeaderName || !groupLeaderPhone || !groupLeaderEmail) {
                      setGroupError(t("public.leaderInfoRequired"));
                      return;
                    }
                    setGroupStep(2);
                  }}
                  className="flex-[2] bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold py-3"
                  data-testid="button-group-next-step"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t("public.nextAddPilgrims")}
                </Button>
              </div>
            </div>
          )}

          {groupStep === 2 && (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                    <Users className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-medium">{groupLeaderName}'s {t("public.group")}</p>
                    <p className="text-slate-500 text-xs">{groupLeaderPhone} · {groupLeaderEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{t("public.roomsAssigned")}</p>
                  <p className="text-gray-900 dark:text-white font-bold">{totalAssignedRooms} {t("public.of")} {groupRoomCount} {t("public.roomsAssigned")}</p>
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((totalAssignedRooms / groupRoomCount) * 100, 100)}%` }}
                />
              </div>

              {groupPilgrims.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t("public.addedPilgrims")} ({groupPilgrims.length})</p>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                    {groupPilgrims.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700/50" data-testid={`row-pilgrim-${i}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-900 dark:text-white text-sm truncate">{p.fullName}</p>
                            <p className="text-slate-500 text-xs">{p.citizenship} · {p.nusukId} · {p.roomCount} {p.roomCount > 1 ? t("public.rooms") : t("public.room")}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePilgrimFromGroup(i)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                          data-testid={`button-remove-pilgrim-${i}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {remainingRooms > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t("public.addPilgrim")}</p>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                      {remainingRooms} {remainingRooms > 1 ? t("public.rooms") : t("public.room")} {t("public.roomsRemaining")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.fullNameShort")}</Label>
                      <Input
                        value={gpFullName}
                        onChange={(e) => setGpFullName(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        placeholder="Full name"
                        data-testid="input-gp-full-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.citizenship")}</Label>
                      <Select value={gpCitizenship} onValueChange={setGpCitizenship}>
                        <SelectTrigger className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9" data-testid="select-gp-citizenship">
                          <SelectValue placeholder={t("public.country")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#1E293B] border-slate-300 dark:border-slate-600 max-h-[200px]">
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.passportNumber")}</Label>
                      <Input
                        value={gpPassport}
                        onChange={(e) => setGpPassport(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        placeholder="A12345678"
                        data-testid="input-gp-passport"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.dateOfBirth")}</Label>
                      <Input
                        type="date"
                        value={gpDob}
                        onChange={(e) => setGpDob(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        data-testid="input-gp-dob"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.passportExpiry")}</Label>
                      <Input
                        type="date"
                        value={gpExpiry}
                        onChange={(e) => setGpExpiry(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        data-testid="input-gp-passport-expiry"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.nusukId")}</Label>
                      <Input
                        value={gpNusukId}
                        onChange={(e) => setGpNusukId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        placeholder="1234567890"
                        maxLength={10}
                        data-testid="input-gp-nusuk-id"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1.5 w-24">
                      <Label className="text-slate-600 dark:text-slate-300 text-xs">{t("public.rooms")}</Label>
                      <Input
                        type="number"
                        value={gpRoomCount}
                        onChange={(e) => setGpRoomCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, remainingRooms)))}
                        className="bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm h-9 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        min="1"
                        max={remainingRooms}
                        data-testid="input-gp-room-count"
                      />
                    </div>
                    <Button
                      onClick={addPilgrimToGroup}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium mt-5 h-9"
                      data-testid="button-add-pilgrim"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {t("public.addPilgrim")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  data-testid="input-csv-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => csvInputRef.current?.click()}
                  className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  data-testid="button-upload-csv"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {t("public.uploadCsv")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadCsvTemplate}
                  className="text-slate-400 hover:text-slate-300 text-xs"
                  data-testid="button-download-csv-template"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {t("public.downloadTemplate")}
                </Button>
              </div>

              {groupPilgrims.length > 0 && selectedBlock && (
                <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">{t("public.groupOrderSummary")}</p>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                    <span>{totalAssignedRooms} {totalAssignedRooms > 1 ? t("public.rooms") : t("public.room")} × {formatPrice(selectedBlock.pricePerNight)}</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(totalAssignedRooms * parseFloat(selectedBlock.pricePerNight))}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>{t("public.vat15")}</span>
                    <span>{formatPrice(totalAssignedRooms * parseFloat(selectedBlock.pricePerNight) * 0.15)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white font-bold pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <span>{t("public.groupTotal")}</span>
                    <span className="text-[#D4AF37] text-lg">{formatPrice(totalAssignedRooms * parseFloat(selectedBlock.pricePerNight) * 1.15)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{groupPilgrims.length} {groupPilgrims.length > 1 ? t("public.pilgrims") : t("public.pilgrim")} · {t("public.eachReceivesRef")}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGroupStep(1)}
                  className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  data-testid="button-group-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("public.back")}
                </Button>
                <Button
                  onClick={submitGroupBooking}
                  disabled={groupBookMutation.isPending || groupPilgrims.length === 0}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold py-3 shadow-lg shadow-[#D4AF37]/10"
                  data-testid="button-submit-group-booking"
                >
                  {groupBookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                  {t("public.confirmGroupBooking")} ({groupPilgrims.length} {groupPilgrims.length > 1 ? t("public.pilgrims") : t("public.pilgrim")})
                </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupConfirmationOpen} onOpenChange={setGroupConfirmationOpen}>
        <DialogContent className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center py-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-group-booking-confirmed">{t("public.groupBookingConfirmed")}</h2>
              <p className="text-slate-400 text-sm mt-1.5">{groupBookingResults.length} {groupBookingResults.length > 1 ? t("public.pilgrims") : t("public.pilgrim")} {t("public.groupBookingConfirmedDesc")}</p>
            </div>
            <div className="w-full space-y-2 max-h-[300px] overflow-y-auto">
              {groupBookingResults.map((b: any, i: number) => (
                <div key={i} className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between" data-testid={`row-group-result-${i}`}>
                  <div className="min-w-0">
                    <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{b.fullName}</p>
                    <p className="text-slate-500 text-xs">{b.roomCount} {b.roomCount > 1 ? t("public.rooms") : t("public.room")} · Nusuk {b.nusukId}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <code className="text-[#D4AF37] font-mono text-sm font-bold">{b.bookingRef}</code>
                    <p className="text-xs text-slate-500">{formatPrice(b.totalWithVat)}</p>
                  </div>
                </div>
              ))}
            </div>
            {groupBookingResults.length > 0 && (
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-3 w-full text-center">
                <p className="text-xs text-slate-400">{t("public.groupTotal")}</p>
                <p className="text-[#D4AF37] font-bold text-lg">
                  {formatPrice(groupBookingResults.reduce((s: number, b: any) => s + parseFloat(b.totalWithVat), 0))}
                </p>
              </div>
            )}
            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 justify-center">
                <Search className="w-4 h-4 text-blue-400" />
                <p className="text-gray-900 dark:text-white text-sm font-semibold">{t("public.trackGroupVisaTitle")}</p>
              </div>
              <p className="text-slate-400 text-xs text-center">{t("public.trackGroupVisaDesc")}</p>
              <a
                href="/booking-status"
                className="block w-full text-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium text-sm py-2.5 rounded-lg border border-blue-500/30 transition-colors"
                data-testid="link-check-group-visa-status"
              >
                {t("public.goToBookingStatus")} →
              </a>
            </div>
            <Button
              onClick={() => setGroupConfirmationOpen(false)}
              className="bg-[#D4AF37] hover:bg-[#C4A030] text-black w-full font-semibold"
              data-testid="button-close-group-confirmation"
            >
              {t("public.done")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="bg-white dark:bg-[#1C2530] border-t border-slate-200 dark:border-slate-700/50 py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-sm">
            <PHXLogo size={20} glow={false} />
            <span>{t("public.poweredBy")} <span className="text-slate-600 dark:text-slate-400 font-medium">PHX Exchange</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>{t("public.secureBooking")}</span>
            <span>•</span>
            <span>{t("public.zatcaCompliant")}</span>
            <span>•</span>
            <span>{t("public.escrowProtected")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
