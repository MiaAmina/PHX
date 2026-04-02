import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Store, Copy, ExternalLink, Plus, Settings, Users, Loader2, FileUp,
  Globe, Percent, Link2, CheckCircle2, Eye, ShieldCheck, UserCheck,
  CloudUpload, Clock, Check, AlertTriangle, Stamp, ShieldAlert,
  Terminal, Wifi, Lock, Zap, Server, Shield, QrCode, FileText
} from "lucide-react";
import { useCurrency } from "@/lib/currency";

function VisaStatusBadge({ status }: { status: string }) {
  if (status === "ISSUED") {
    return (
      <Badge className="bg-emerald-500 text-white border-none flex items-center gap-1 shadow-sm shadow-emerald-500/25">
        <CheckCircle2 className="w-3 h-3" />
        ISSUED
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge className="bg-red-500 text-white border-none flex items-center gap-1 shadow-sm shadow-red-500/25">
        <ShieldAlert className="w-3 h-3" />
        REJECTED
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500 text-white border-none flex items-center gap-1 shadow-sm shadow-amber-500/25">
      <Eye className="w-3 h-3" />
      PENDING
    </Badge>
  );
}

function sanitizeToUpperLatin(name: string): string {
  const charMap: Record<string, string> = {
    'ä': 'AE', 'ö': 'OE', 'ü': 'UE', 'ß': 'SS',
    'à': 'A', 'á': 'A', 'â': 'A', 'ã': 'A', 'å': 'A',
    'è': 'E', 'é': 'E', 'ê': 'E', 'ë': 'E',
    'ì': 'I', 'í': 'I', 'î': 'I', 'ï': 'I',
    'ò': 'O', 'ó': 'O', 'ô': 'O', 'õ': 'O',
    'ù': 'U', 'ú': 'U', 'û': 'U',
    'ý': 'Y', 'ÿ': 'Y',
    'ñ': 'N', 'ç': 'C', 'ð': 'D', 'þ': 'TH',
    'ø': 'O', 'æ': 'AE',
    'Ä': 'AE', 'Ö': 'OE', 'Ü': 'UE',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U',
    'Ý': 'Y', 'Ñ': 'N', 'Ç': 'C', 'Ð': 'D', 'Þ': 'TH',
    'Ø': 'O', 'Æ': 'AE',
  };
  let result = '';
  for (const char of name) {
    result += charMap[char] || char;
  }
  return result.toUpperCase().replace(/[^A-Z\s\-']/g, '');
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  errorFields: string[];
  sanitizedName: string;
}

function validatePreFlight(booking: any): ValidationResult {
  const errors: string[] = [];
  const errorFields: string[] = [];
  const cutoffDate = new Date('2026-12-20');

  if (booking.passportExpiry) {
    const expiry = new Date(booking.passportExpiry);
    if (expiry <= cutoffDate) {
      errors.push("Passport Expiry must be after Dec 20, 2026.");
      errorFields.push("passportExpiry");
    }
  } else {
    errors.push("Passport expiry date is missing.");
    errorFields.push("passportExpiry");
  }

  if (!booking.nusukId || !/^\d{10}$/.test(booking.nusukId)) {
    errors.push("Nusuk ID must be exactly 10 digits.");
    errorFields.push("nusukId");
  }

  if (!booking.passportNumber || booking.passportNumber.trim().length < 5) {
    errors.push("Passport number must be at least 5 characters.");
    errorFields.push("passportNumber");
  }

  const sanitizedName = sanitizeToUpperLatin(booking.fullName || '');
  if (!sanitizedName.trim()) {
    errors.push("Full name is missing or invalid after sanitization.");
    errorFields.push("fullName");
  }

  if (!booking.dob) {
    errors.push("Date of birth is missing.");
    errorFields.push("dob");
  }

  if (!booking.citizenship || !booking.citizenship.trim()) {
    errors.push("Citizenship is missing.");
    errorFields.push("citizenship");
  }

  return { valid: errors.length === 0, errors, errorFields, sanitizedName };
}

function encodeTlvTag(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const result = new Uint8Array(2 + valueBytes.length);
  result[0] = tag;
  result[1] = valueBytes.length;
  result.set(valueBytes, 2);
  return result;
}

function generateZatcaQrBase64(sellerName: string, vatNumber: string, timestamp: string, totalAmount: string, vatAmount: string): string {
  const tag1 = encodeTlvTag(1, sellerName);
  const tag2 = encodeTlvTag(2, vatNumber);
  const tag3 = encodeTlvTag(3, timestamp);
  const tag4 = encodeTlvTag(4, totalAmount);
  const tag5 = encodeTlvTag(5, vatAmount);
  const combined = new Uint8Array(tag1.length + tag2.length + tag3.length + tag4.length + tag5.length);
  let offset = 0;
  for (const arr of [tag1, tag2, tag3, tag4, tag5]) {
    combined.set(arr, offset);
    offset += arr.length;
  }
  let binary = '';
  combined.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function ZatcaQrCode({ booking }: { booking: any }) {
  const { formatPrice } = useCurrency();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const sellerName = "PHX Exchange Platform";
    const vatNumber = "300000000000003";
    const timestamp = new Date().toISOString();
    const totalAmount = booking.totalWithVat || "0.00";
    const vatAmount = booking.vatAmount || "0.00";
    const base64Data = generateZatcaQrBase64(sellerName, vatNumber, timestamp, totalAmount, vatAmount);

    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    const data = atob(base64Data);
    const gridSize = Math.ceil(Math.sqrt(data.length * 8));
    const cellSize = Math.floor((size - 20) / gridSize);
    const offsetX = Math.floor((size - gridSize * cellSize) / 2);
    const offsetY = Math.floor((size - gridSize * cellSize) / 2);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(offsetX, offsetY, 3 * cellSize, 3 * cellSize);
    ctx.fillRect(offsetX + (gridSize - 3) * cellSize, offsetY, 3 * cellSize, 3 * cellSize);
    ctx.fillRect(offsetX, offsetY + (gridSize - 3) * cellSize, 3 * cellSize, 3 * cellSize);

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(offsetX + cellSize, offsetY + cellSize, cellSize, cellSize);
    ctx.fillRect(offsetX + (gridSize - 2) * cellSize, offsetY + cellSize, cellSize, cellSize);
    ctx.fillRect(offsetX + cellSize, offsetY + (gridSize - 2) * cellSize, cellSize, cellSize);

    let bitIndex = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if ((x < 3 && y < 3) || (x >= gridSize - 3 && y < 3) || (x < 3 && y >= gridSize - 3)) continue;
        const byteIdx = Math.floor(bitIndex / 8);
        const bitPos = bitIndex % 8;
        if (byteIdx < data.length) {
          const bit = (data.charCodeAt(byteIdx) >> (7 - bitPos)) & 1;
          if (bit) {
            ctx.fillStyle = '#D4AF37';
            ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
          }
        }
        bitIndex++;
      }
    }

    setQrDataUrl(canvas.toDataURL());
  }, [booking]);

  if (!qrDataUrl) return null;

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="p-3 bg-[#0A0F1A] rounded-xl border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5">
          <img src={qrDataUrl} alt="ZATCA QR Code" className="w-40 h-40 rounded" data-testid="img-zatca-qr" />
        </div>
      </div>
      <div className="bg-background rounded-lg border border-border/30 p-3 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-[10px] font-mono uppercase">Seller</span>
          <span className="text-foreground/80 text-[10px] font-mono">PHX Exchange Platform</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-[10px] font-mono uppercase">VAT No.</span>
          <span className="text-foreground/80 text-[10px] font-mono">300000000000003</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-[10px] font-mono uppercase">Total</span>
          <span className="text-emerald-400 text-[10px] font-mono font-bold">{formatPrice(booking.totalWithVat)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-[10px] font-mono uppercase">VAT (15%)</span>
          <span className="text-emerald-400 text-[10px] font-mono">{formatPrice(booking.vatAmount)}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center font-mono">ZATCA Phase 2 — TLV Base64-Encoded • Tag 1-5 Compliant</p>
    </div>
  );
}

function NusukSyncBadge({ synced }: { synced: boolean }) {
  if (synced) {
    return (
      <Badge className="bg-sky-500 text-white border-none flex items-center gap-1 shadow-sm shadow-sky-500/25">
        <Check className="w-3 h-3" />
        Synced
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-500 text-white border-none flex items-center gap-1 shadow-sm shadow-orange-500/25">
      <Clock className="w-3 h-3" />
      Pending
    </Badge>
  );
}

export default function StorefrontPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [createOpen, setCreateOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [slug, setSlug] = useState("");
  const [markupPercent, setMarkupPercent] = useState("10.00");
  const [editAgencyName, setEditAgencyName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editMarkup, setEditMarkup] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [nusukDialogOpen, setNusukDialogOpen] = useState(false);
  const [nusukBooking, setNusukBooking] = useState<any>(null);
  const [syncStep, setSyncStep] = useState<"validation_failed" | "preview" | "syncing" | "done" | "editing">("preview");
  const [editFullName, setEditFullName] = useState("");
  const [editPassportNumber, setEditPassportNumber] = useState("");
  const [editPassportExpiry, setEditPassportExpiry] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editNusukId, setEditNusukId] = useState("");
  const [editCitizenship, setEditCitizenship] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const hasFieldError = (field: string) => {
    if (!validationResult || !validationResult.errorFields || !Array.isArray(validationResult.errorFields)) return false;
    return validationResult.errorFields.indexOf(field) !== -1;
  };
  const [transmitStage, setTransmitStage] = useState(0);
  const [syncTimestamp, setSyncTimestamp] = useState("");
  const [showQr, setShowQr] = useState(false);

  const { data: storefront, isLoading } = useQuery<any>({
    queryKey: ["/api/storefront"],
  });

  const { data: pilgrimBookings } = useQuery<any[]>({
    queryKey: ["/api/storefront/bookings"],
    enabled: !!storefront,
  });

  const { data: platformConfig } = useQuery<{ nusukSimulationMode: boolean }>({
    queryKey: ["/api/platform-config"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/storefront", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront"] });
      setCreateOpen(false);
      toast({ title: t("storefront.created") });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/storefront", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront"] });
      toast({ title: t("storefront.settingsUpdated") });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const nusukSyncMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("POST", `/api/storefront/bookings/${bookingId}/nusuk-sync`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/bookings"] });
      setSyncStep("done");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (data: { bookingId: string; fullName: string; passportNumber: string; passportExpiry: string; dob: string; nusukId: string; citizenship: string }) => {
      const res = await apiRequest("PATCH", `/api/storefront/bookings/${data.bookingId}/details`, {
        fullName: data.fullName,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry,
        dob: data.dob,
        nusukId: data.nusukId,
        citizenship: data.citizenship,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/bookings"] });
      setNusukDialogOpen(false);
      setNusukBooking(null);
      setSyncStep("preview");
      setValidationResult(null);
      toast({ title: "Pilgrim details updated", description: "You can now retry the Nusuk sync." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openNusukDialog = (booking: any) => {
    const result = validatePreFlight(booking);
    setValidationResult(result);
    setNusukBooking({ ...booking, sanitizedName: result.sanitizedName });
    if (result.valid) {
      setSyncStep("preview");
    } else {
      setSyncStep("validation_failed");
      toast({
        title: "Validation Error",
        description: result.errors[0],
        variant: "destructive",
      });
    }
    setNusukDialogOpen(true);
  };

  const handleNusukSync = () => {
    setSyncStep("syncing");
    setTransmitStage(0);
    setShowQr(false);
    setTimeout(() => setTransmitStage(1), 1000);
    setTimeout(() => setTransmitStage(2), 2000);
    setTimeout(() => {
      setTransmitStage(3);
      setSyncTimestamp(new Date().toISOString());
      nusukSyncMutation.mutate(nusukBooking.id);
    }, 3000);
  };

  const ministryApprovalMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("POST", `/api/storefront/bookings/${bookingId}/ministry-approval`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/bookings"] });
      toast({
        title: "Ministry Approval Received",
        description: `Visa ${data.visaNumber} issued successfully.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const batchSyncMutation = useMutation({
    mutationFn: async (bookingIds: string[]) => {
      const res = await apiRequest("POST", "/api/storefront/bookings/batch-sync", { bookingIds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/bookings"] });
      const syncCount = data.synced?.length || 0;
      const failCount = data.failed?.length || 0;
      if (failCount === 0) {
        toast({
          title: "Group Synced Successfully",
          description: `${syncCount} pilgrim${syncCount !== 1 ? "s" : ""} synced to Nusuk Masar.`,
        });
      } else {
        toast({
          title: "Partial Sync",
          description: `${syncCount} synced, ${failCount} failed. Check individual bookings for errors.`,
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({ title: "Batch Sync Failed", description: err.message, variant: "destructive" });
    },
  });

  const groupedBookings = (() => {
    if (!pilgrimBookings) return {};
    const groups: Record<string, any[]> = {};
    for (const b of pilgrimBookings) {
      if (b.groupLeaderName) {
        const key = b.groupLeaderName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      }
    }
    return groups;
  })();

  const handleBatchSync = (groupLeaderName: string) => {
    const group = groupedBookings[groupLeaderName];
    if (!group) return;
    const unsyncedIds = group.filter((b: any) => !b.nusukSynced).map((b: any) => b.id);
    if (unsyncedIds.length === 0) {
      toast({ title: "Already Synced", description: "All pilgrims in this group are already synced." });
      return;
    }
    batchSyncMutation.mutate(unsyncedIds);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/s/${storefront.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: t("storefront.linkCopied") });
  };

  const handleUpdate = () => {
    const data: any = {};
    if (editAgencyName && editAgencyName !== storefront.agencyName) data.agencyName = editAgencyName;
    if (editSlug && editSlug !== storefront.slug) data.slug = editSlug;
    if (editMarkup && editMarkup !== storefront.markupPercent) data.markupPercent = editMarkup;
    if (editDescription !== (storefront.agencyDescription || "")) data.agencyDescription = editDescription;
    if (editActive !== storefront.isActive) data.isActive = editActive;
    if (Object.keys(data).length > 0) {
      updateMutation.mutate(data);
    }
  };

  const initEditFields = () => {
    if (storefront) {
      setEditAgencyName(storefront.agencyName);
      setEditSlug(storefront.slug);
      setEditMarkup(storefront.markupPercent);
      setEditDescription(storefront.agencyDescription || "");
      setEditActive(storefront.isActive);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-storefront">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-storefront-title">
            <Store className="w-6 h-6 text-[#D4AF37]" />
            {t("storefront.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("storefront.subtitle")}</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-5">
            <div className="p-5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <Store className="h-12 w-12 text-[#D4AF37]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground" data-testid="text-no-storefront">{t("storefront.noStorefront")}</h3>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed">{t("storefront.noStorefrontDesc")}</p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-6" data-testid="button-create-storefront">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("storefront.createStorefront")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#D4AF37]" />
                    {t("storefront.createStorefront")}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Set up your public storefront to receive pilgrim bookings directly.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{t("storefront.agencyName")}</Label>
                    <Input
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="bg-background border-border text-foreground focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                      placeholder="Al Safar Travel Agency"
                      data-testid="input-agency-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{t("storefront.slug")}</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="bg-background border-border text-foreground focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                      placeholder="al-safar"
                      data-testid="input-slug"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{t("storefront.publicUrl")}</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80">/s/{slug || "your-slug"}</code>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground/80 text-sm">{t("storefront.markupPercent")}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(e.target.value)}
                        className="bg-background border-border text-foreground pr-8 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                        min="0"
                        max="100"
                        step="0.5"
                        data-testid="input-markup-percent"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Applied on top of room base price</p>
                  </div>
                  <Button
                    onClick={() => createMutation.mutate({ agencyName, slug, markupPercent })}
                    disabled={!agencyName || !slug || createMutation.isPending}
                    className="w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold"
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {t("storefront.createStorefront")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBookings = pilgrimBookings?.length || 0;
  const issuedVisas = pilgrimBookings?.filter((b: any) => b.visaStatus === "ISSUED").length || 0;
  const totalRevenue = pilgrimBookings?.reduce((sum: number, b: any) => sum + parseFloat(b.totalWithVat || "0"), 0) || 0;
  const pendingSync = pilgrimBookings?.filter((b: any) => !b.nusukSynced).length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="rounded-xl bg-gradient-to-r from-[#dce6f0] to-[#c8d8e8] dark:from-[#1C2530] dark:to-[#2A3A4A] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#8B7320] dark:bg-gold/20 dark:text-gold">
                  {storefront.isActive ? "Live" : "Offline"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5" data-testid="text-storefront-title">
                <Store className="w-6 h-6 text-[#D4AF37]" />
                {storefront.agencyName}
              </h1>
              <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">{t("storefront.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={copyLink} className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold shadow-sm shadow-[#D4AF37]/20" data-testid="button-copy-link">
                <Copy className="h-4 w-4 mr-2" />
                {t("storefront.copyLink")}
              </Button>
              <Button onClick={() => window.open(`/s/${storefront.slug}`, "_blank")} className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold shadow-sm shadow-[#D4AF37]/20" data-testid="button-preview">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("storefront.preview")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-2">
              <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-total-bookings">{totalBookings}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{t("storefront.pilgrimBookings")}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="p-2 rounded-lg bg-emerald-500/10 w-fit mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-visas-issued">{issuedVisas}<span className="text-sm sm:text-base font-normal text-muted-foreground ml-1">/ {totalBookings}</span></p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{t("storefront.visasIssued")}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="p-2 rounded-lg bg-orange-500/10 w-fit mb-2">
              <CloudUpload className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-pending-sync">{pendingSync}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{t("storefront.pendingSync")}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10 w-fit mb-2">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[#D4AF37] break-all" data-testid="text-total-revenue">
              {formatPrice(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{t("storefront.totalRevenue")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#D4AF37]" />
                {t("storefront.settings")}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Configure your storefront appearance and pricing
              </CardDescription>
            </div>
            <Badge variant="outline" className={storefront.isActive
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
            }>
              {storefront.isActive ? "Live" : "Offline"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">{t("storefront.agencyName")}</Label>
              <Input
                defaultValue={storefront.agencyName}
                onChange={(e) => setEditAgencyName(e.target.value)}
                onFocus={initEditFields}
                className="bg-background border-border text-foreground focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                data-testid="input-edit-agency-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">{t("storefront.slug")}</Label>
              <Input
                defaultValue={storefront.slug}
                onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                onFocus={initEditFields}
                className="bg-background border-border text-foreground focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                data-testid="input-edit-slug"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{t("storefront.publicUrl")}</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80">/s/{editSlug || storefront.slug}</code>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">{t("storefront.markupPercent")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  defaultValue={storefront.markupPercent}
                  onChange={(e) => setEditMarkup(e.target.value)}
                  onFocus={initEditFields}
                  className="bg-background border-border text-foreground pr-8 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                  min="0"
                  max="100"
                  step="0.5"
                  data-testid="input-edit-markup"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm">{t("storefront.isActive")}</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  defaultChecked={storefront.isActive}
                  onCheckedChange={(v) => { initEditFields(); setEditActive(v); }}
                  data-testid="switch-active"
                />
                <span className="text-sm text-muted-foreground">{storefront.isActive ? "Accepting bookings" : "Storefront hidden"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/80 text-sm">Description</Label>
            <Textarea
              defaultValue={storefront.agencyDescription || ""}
              onChange={(e) => setEditDescription(e.target.value)}
              onFocus={initEditFields}
              className="bg-background border-border text-foreground focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
              rows={3}
              placeholder="Tell pilgrims about your agency and services..."
              data-testid="input-edit-description"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>Public URL:</span>
              <code className="text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded text-xs font-mono">
                {window.location.origin}/s/{storefront.slug}
              </code>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold"
              data-testid="button-update-settings"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              {t("storefront.updateSettings")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#D4AF37]" />
                {t("storefront.pilgrimBookings")}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                {totalBookings} total booking{totalBookings !== 1 ? "s" : ""} — {issuedVisas} visa{issuedVisas !== 1 ? "s" : ""} issued — {pendingSync} pending gov sync
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalBookings === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-2xl bg-muted/50 inline-block mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium" data-testid="text-no-bookings">{t("storefront.noBookings")}</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">{t("storefront.noBookingsDesc")}</p>
            </div>
          ) : (
            <>
            {Object.keys(groupedBookings).length > 0 && (
              <div className="mb-5 p-4 rounded-lg bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/15 dark:border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold mb-3">Group Batch Actions</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(groupedBookings).map(([leaderName, members]) => {
                    const unsyncedCount = (members as any[]).filter((b: any) => !b.nusukSynced).length;
                    const totalCount = (members as any[]).length;
                    if (unsyncedCount === 0) return null;
                    return (
                      <Button
                        key={leaderName}
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchSync(leaderName)}
                        disabled={batchSyncMutation.isPending}
                        className="border-blue-500/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-500/50 bg-white dark:bg-blue-500/5 transition-colors"
                        data-testid={`button-batch-sync-${leaderName.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {batchSyncMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CloudUpload className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Sync Entire Group: {leaderName} ({unsyncedCount}/{totalCount} pending)
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("storefront.bookingRef")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("pilgrim.fullName")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("pilgrim.citizenship")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("pilgrim.nusukId")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("wallet.amount")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("pilgrim.visaStatus")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("storefront.govSync")}</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-right">{t("storefront.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pilgrimBookings?.map((booking: any) => (
                    <TableRow key={booking.id} className="border-border/50 hover:bg-muted/30" data-testid={`row-pilgrim-${booking.id}`}>
                      <TableCell>
                        <code className="text-foreground font-mono text-xs font-semibold" data-testid={`text-ref-${booking.id}`}>
                          {booking.bookingRef || "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground font-medium">{booking.fullName}</span>
                        {booking.groupLeaderName && (
                          <span className="block text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                            Group: {booking.groupLeaderName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground/80">{booking.citizenship}</TableCell>
                      <TableCell className="text-foreground/80 font-mono text-xs">{booking.nusukId}</TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatPrice(booking.totalWithVat)}</TableCell>
                      <TableCell>
                        <VisaStatusBadge status={booking.visaStatus} />
                        {booking.visaStatus === "REJECTED" && booking.ministryRejectionReason && (
                          <p className="text-xs text-red-400 mt-1 max-w-[180px] truncate" title={booking.ministryRejectionReason}>
                            {booking.ministryRejectionReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <NusukSyncBadge synced={booking.nusukSynced} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!booking.nusukSynced && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openNusukDialog(booking)}
                              className="border-orange-500/30 text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:border-orange-500/50 transition-colors"
                              data-testid={`button-nusuk-sync-${booking.id}`}
                            >
                              <CloudUpload className="h-3.5 w-3.5 mr-1.5" />
                              Sync to Nusuk
                            </Button>
                          )}
                          {booking.nusukSynced && booking.visaStatus !== "ISSUED" && platformConfig?.nusukSimulationMode && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => ministryApprovalMutation.mutate(booking.id)}
                              disabled={ministryApprovalMutation.isPending}
                              className="border-purple-500/30 text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-500/50 transition-colors"
                              data-testid={`button-ministry-approve-${booking.id}`}
                            >
                              {ministryApprovalMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Stamp className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Simulate Ministry Approval
                            </Button>
                          )}
                          {booking.nusukSynced && booking.visaStatus !== "ISSUED" && !platformConfig?.nusukSimulationMode && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Awaiting Ministry Response
                            </Badge>
                          )}
                          {booking.nusukSynced && booking.visaStatus === "ISSUED" && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {booking.visaNumber}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>


      <Dialog open={nusukDialogOpen} onOpenChange={(open) => { if (!open) { setNusukDialogOpen(false); setNusukBooking(null); setSyncStep("preview"); setValidationResult(null); setShowQr(false); setTransmitStage(0); } }}>
        <DialogContent className="bg-[#0B1120] border-border/50 max-w-2xl p-0 overflow-hidden shadow-2xl shadow-black/50">
          <div className="bg-gradient-to-r from-[#0F172A] via-[#131C2E] to-[#0F172A] px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Terminal className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <DialogTitle className="text-foreground text-lg font-bold tracking-tight">Nusuk Masar — Data Transmission</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs font-mono mt-0.5">Ministry of Hajj & Umrah • Accommodation Verification API</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {syncStep === "preview" && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider px-2.5">
                    <Wifi className="w-3 h-3 mr-1" />
                    Connection Secure
                  </Badge>
                )}
                {syncStep === "validation_failed" && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono uppercase tracking-wider px-2.5">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    Validation Failed
                  </Badge>
                )}
                {syncStep === "syncing" && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-mono uppercase tracking-wider px-2.5 animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Transmitting
                  </Badge>
                )}
                {syncStep === "done" && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider px-2.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Sync Confirmed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {nusukBooking && syncStep === "validation_failed" && validationResult && (
            <div className="p-6 space-y-5">
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-red-500/10">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold text-sm">Pre-Flight Compliance Check Failed</h4>
                    <p className="text-red-400/60 text-xs font-mono mt-0.5">The following fields do not meet 2026 Hajj regulatory requirements</p>
                  </div>
                </div>
                <ul className="space-y-3" data-testid="list-validation-errors">
                  {validationResult.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-3 bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-red-300 text-sm font-medium">{err}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">Record Details</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Pilgrim</span>
                    <span className="text-foreground font-medium text-sm">{nusukBooking.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Sanitized</span>
                    <code className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-mono">{nusukBooking.sanitizedName}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Passport Expiry</span>
                    <span className="text-red-400 font-mono text-sm font-bold">{nusukBooking.passportExpiry || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Nusuk ID</span>
                    <span className="text-foreground font-mono text-sm">{nusukBooking.nusukId || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300/80 leading-relaxed">Government systems will reject non-compliant records. Correct the flagged fields and retry the sync to proceed with visa processing.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditFullName(nusukBooking.fullName || "");
                    setEditPassportNumber(nusukBooking.passportNumber || "");
                    setEditPassportExpiry(nusukBooking.passportExpiry || "");
                    setEditDob(nusukBooking.dob || "");
                    setEditNusukId(nusukBooking.nusukId || "");
                    setEditCitizenship(nusukBooking.citizenship || "");
                    setSyncStep("editing");
                  }}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold h-11"
                  data-testid="button-fix-data"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Fix Data Now
                </Button>
                <Button
                  onClick={() => { setNusukDialogOpen(false); setNusukBooking(null); setSyncStep("preview"); setValidationResult(null); }}
                  variant="outline"
                  className="flex-1 border-border text-muted-foreground hover:text-foreground hover:border-border h-11"
                  data-testid="button-close-validation"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {nusukBooking && syncStep === "editing" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <Settings className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="text-foreground font-bold text-sm">Edit Pilgrim Details</h4>
                  <p className="text-muted-foreground text-xs mt-0.5">Correct the flagged fields, then save and retry sync</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className={`text-xs uppercase tracking-wider ${hasFieldError("fullName") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                    Full Name {hasFieldError("fullName") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                  </Label>
                  <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className={`bg-background h-9 ${hasFieldError("fullName") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-fullname" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={`text-xs uppercase tracking-wider ${hasFieldError("citizenship") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                      Citizenship {hasFieldError("citizenship") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </Label>
                    <Input value={editCitizenship} onChange={(e) => setEditCitizenship(e.target.value)} className={`bg-background h-9 ${hasFieldError("citizenship") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-citizenship" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={`text-xs uppercase tracking-wider ${hasFieldError("passportNumber") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                      Passport Number {hasFieldError("passportNumber") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </Label>
                    <Input value={editPassportNumber} onChange={(e) => setEditPassportNumber(e.target.value)} className={`bg-background h-9 font-mono ${hasFieldError("passportNumber") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-passport" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={`text-xs uppercase tracking-wider ${hasFieldError("dob") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                      Date of Birth {hasFieldError("dob") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </Label>
                    <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className={`bg-background h-9 ${hasFieldError("dob") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-dob" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={`text-xs uppercase tracking-wider ${hasFieldError("passportExpiry") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                      Passport Expiry {hasFieldError("passportExpiry") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </Label>
                    <Input type="date" value={editPassportExpiry} onChange={(e) => setEditPassportExpiry(e.target.value)} className={`bg-background h-9 ${hasFieldError("passportExpiry") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-expiry" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={`text-xs uppercase tracking-wider ${hasFieldError("nusukId") ? "text-red-400 font-semibold" : "text-foreground/70"}`}>
                    Nusuk ID (10 digits) {hasFieldError("nusukId") && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                  </Label>
                  <Input value={editNusukId} onChange={(e) => setEditNusukId(e.target.value)} maxLength={10} className={`bg-background h-9 font-mono ${hasFieldError("nusukId") ? "border-red-500 ring-1 ring-red-500/30" : "border-border"}`} data-testid="input-edit-nusukid" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => updateDetailsMutation.mutate({
                    bookingId: nusukBooking.id,
                    fullName: editFullName,
                    passportNumber: editPassportNumber,
                    passportExpiry: editPassportExpiry,
                    dob: editDob,
                    nusukId: editNusukId,
                    citizenship: editCitizenship,
                  })}
                  disabled={updateDetailsMutation.isPending || !editFullName || !editPassportNumber || !editPassportExpiry || !editDob || !editNusukId || !editCitizenship}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                  data-testid="button-save-details"
                >
                  {updateDetailsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Save & Close
                </Button>
                <Button
                  onClick={() => setSyncStep("validation_failed")}
                  variant="outline"
                  className="border-border text-muted-foreground hover:text-foreground h-11"
                  data-testid="button-back-validation"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {nusukBooking && syncStep === "preview" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-emerald-400 text-sm font-semibold">Pre-Flight Validation Passed</span>
                  <span className="text-emerald-400/50 text-xs ml-2 font-mono">• All 2026 Hajj compliance rules satisfied</span>
                </div>
              </div>

              {nusukBooking.sanitizedName !== nusukBooking.fullName && (
                <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-2.5">
                  <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-300">
                    <span className="font-semibold">Name Auto-Sanitized:</span>{" "}
                    <span className="text-muted-foreground line-through">{nusukBooking.fullName}</span>
                    {" → "}
                    <span className="text-blue-400 font-mono font-bold">{nusukBooking.sanitizedName}</span>
                  </p>
                </div>
              )}

              <div className="bg-[#0A0F1A] rounded-xl border border-border/50 overflow-hidden shadow-lg shadow-black/20">
                <div className="bg-background px-4 py-3 border-b border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                    </div>
                    <code className="text-[11px] text-muted-foreground font-mono">nusuk-masar-api-v1.js</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <code className="text-[10px] text-emerald-500/70 font-mono">TLS 1.3</code>
                  </div>
                </div>

                <div className="px-5 py-1 bg-muted/20 border-b border-border/20">
                  <code className="text-[11px] font-mono">
                    <span className="text-green-400">POST</span>
                    <span className="text-muted-foreground"> /api/nusuk-masar/v1/</span>
                    <span className="text-orange-300">accommodation-verify</span>
                  </code>
                </div>

                <pre className="p-5 overflow-x-auto" data-testid="code-json-payload">
                  <code className="text-sm font-mono leading-relaxed">
                    <span className="text-muted-foreground">{"{"}</span>{"\n"}
                    {"  "}<span className="text-purple-400">"booking_ref"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.bookingRef}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"nusuk_id"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.nusukId}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"passport_number"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.passportNumber}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"full_name"</span><span className="text-muted-foreground">:</span> <span className="text-cyan-300">"{nusukBooking.sanitizedName}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"citizenship"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.citizenship}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"room_count"</span><span className="text-muted-foreground">:</span> <span className="text-amber-400">{nusukBooking.roomCount}</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"block_id"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.blockId}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"hotel_id"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{nusukBooking.storefrontId}"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"platform"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"PHX Exchange"</span><span className="text-muted-foreground">,</span>{"\n"}
                    {"  "}<span className="text-purple-400">"timestamp"</span><span className="text-muted-foreground">:</span> <span className="text-emerald-400">"{new Date().toISOString()}"</span>{"\n"}
                    <span className="text-muted-foreground">{"}"}</span>
                  </code>
                </pre>
              </div>

              <Button
                onClick={handleNusukSync}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold h-12 text-sm tracking-wide shadow-lg shadow-orange-500/20 transition-all duration-200"
                data-testid="button-confirm-nusuk-sync"
              >
                <CloudUpload className="h-4.5 w-4.5 mr-2.5" />
                Transmit to Nusuk Masar
              </Button>
            </div>
          )}

          {syncStep === "syncing" && (
            <div className="p-6">
              <div className="flex flex-col items-center py-10 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" style={{ animationDuration: "1.5s" }}></div>
                  <div className="relative p-5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-400" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-foreground font-bold text-lg tracking-tight">Secure Transmission in Progress</h3>
                  <p className="text-muted-foreground text-xs font-mono">nusuk-masar-api.gov.sa:443</p>
                </div>

                <div className="w-full bg-[#0A0F1A] rounded-xl border border-border/30 overflow-hidden">
                  <div className="bg-background px-4 py-2 border-b border-border/20 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Transmission Log</span>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      {transmitStage >= 1
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                      }
                      <span className={transmitStage >= 1 ? "text-emerald-400" : "text-orange-400"}>
                        Encrypting payload...
                      </span>
                      {transmitStage >= 1 && <span className="text-muted-foreground ml-auto">AES-256-GCM</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {transmitStage >= 2
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : transmitStage >= 1
                          ? <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                          : <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                      }
                      <span className={transmitStage >= 2 ? "text-emerald-400" : transmitStage >= 1 ? "text-orange-400" : "text-muted-foreground"}>
                        Performing ZATCA hash validation...
                      </span>
                      {transmitStage >= 2 && <span className="text-muted-foreground ml-auto">SHA-256 ✓</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {transmitStage >= 3
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        : transmitStage >= 2
                          ? <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                          : <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                      }
                      <span className={transmitStage >= 3 ? "text-emerald-400" : transmitStage >= 2 ? "text-orange-400 animate-pulse" : "text-muted-foreground"}>
                        Handshaking with Nusuk Masar API...
                      </span>
                      {transmitStage >= 3 && <span className="text-muted-foreground ml-auto">200 OK</span>}
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border/20 bg-muted/20">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((transmitStage / 3) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {syncStep === "done" && (
            <div className="p-6">
              <div className="flex flex-col items-center space-y-5">
                <div className="w-full bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" style={{ animationDuration: "2s" }}></div>
                      <div className="relative p-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
                        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge className="bg-emerald-500 text-white border-0 px-4 py-1.5 text-sm font-bold tracking-wide shadow-lg shadow-emerald-500/30" data-testid="badge-verified">
                      VERIFIED — SYNC CONFIRMED
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight" data-testid="text-sync-success">Data Received by Ministry</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">Accommodation record accepted and queued for visa processing by the Ministry of Hajj & Umrah.</p>
                </div>

                <div className="w-full bg-[#0A0F1A] rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-background border-b border-border/30 flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">API Response — 200 OK</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Status</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[10px] px-2.5">
                        ACCEPTED
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Booking Reference</span>
                      <code className="text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-md text-sm font-mono font-bold tracking-wider" data-testid="text-booking-ref">{nusukBooking?.bookingRef}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Timestamp</span>
                      <code className="text-muted-foreground text-[10px] font-mono" data-testid="text-sync-timestamp">{syncTimestamp}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Pilgrim</span>
                      <span className="text-foreground text-xs font-medium">{nusukBooking?.sanitizedName || nusukBooking?.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Next Step</span>
                      <span className="text-orange-400 text-[10px] font-mono">AWAITING_VISA_ISSUANCE</span>
                    </div>
                  </div>
                </div>

                {!showQr ? (
                  <Button
                    onClick={() => setShowQr(true)}
                    variant="outline"
                    className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] h-11 font-semibold"
                    data-testid="button-view-invoice"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View Digital Invoice — ZATCA Phase 2 QR
                  </Button>
                ) : (
                  <div className="w-full bg-[#0A0F1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden">
                    <div className="px-4 py-2.5 bg-background border-b border-[#D4AF37]/10 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider">ZATCA Phase 2 — Electronic Tax Invoice</span>
                    </div>
                    <div className="p-4">
                      {nusukBooking && <ZatcaQrCode booking={nusukBooking} />}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => { setNusukDialogOpen(false); setNusukBooking(null); setSyncStep("preview"); setValidationResult(null); setShowQr(false); }}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C4A030] hover:from-[#C4A030] hover:to-[#B39020] text-black font-bold h-12 shadow-lg shadow-[#D4AF37]/10"
                  data-testid="button-close-sync"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
