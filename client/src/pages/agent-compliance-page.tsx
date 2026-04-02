import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FileText, Shield, Building2, Hash, Loader2, CheckCircle2, Clock, XCircle,
  Upload, Calendar, Landmark, CreditCard, User, FileCheck, ExternalLink, Download,
  AlertCircle, ArrowRight, Briefcase
} from "lucide-react";

const SA_IBAN_REGEX = /^SA\d{22}$/;

function FileUploadField({
  label,
  currentUrl,
  onUploaded,
  testId,
}: {
  label: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  testId: string;
}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/compliance/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      const data = await res.json();
      onUploaded(data.url);
      toast({ title: t("compliance.fileUploaded") });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <FileCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
        {label}
      </Label>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`flex-shrink-0 h-10 px-4 rounded-xl border-2 border-dashed transition-all ${currentUrl ? "border-emerald-400/40 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-slate-300 dark:border-slate-600 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"}`}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid={`button-upload-${testId}`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" /> : currentUrl ? <CheckCircle2 className="w-4 h-4 me-1.5 text-emerald-500" /> : <Upload className="w-4 h-4 me-1.5 text-slate-400" />}
          {uploading ? t("compliance.uploading") : currentUrl ? "File uploaded" : t("compliance.chooseFile")}
        </Button>
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 font-medium transition-colors"
            data-testid={`link-view-${testId}`}
          >
            <ExternalLink className="w-3 h-3" />
            {t("compliance.viewCurrentFile")}
          </a>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleUpload}
        data-testid={`input-file-${testId}`}
      />
    </div>
  );
}

function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

function CompletionTracker({ items }: { items: { label: string; done: boolean }[] }) {
  const completed = items.filter(i => i.done).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-[-0.01em] text-foreground">Profile Completion</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pct === 100 ? "bg-emerald-500/15 text-emerald-500" : "bg-[#D4AF37]/15 text-[#D4AF37]"}`}>{completed}/{items.length}</span>
        </div>
        <span className={`text-lg font-semibold tabular-nums ${pct === 100 ? "text-emerald-500" : "text-[#D4AF37]"}`}>{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? "linear-gradient(90deg, #10B981, #34D399)"
              : "linear-gradient(90deg, #D4AF37, #F5D061)",
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px] py-0.5">
            {item.done ? (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            )}
            <span className={`truncate ${item.done ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentCompliancePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isImpersonating } = useAuth();

  const { data: compliance, isLoading } = useQuery<any>({
    queryKey: ["/api/agent/compliance"],
  });

  const [crNumber, setCrNumber] = useState("");
  const [tourismLicense, setTourismLicense] = useState("");
  const [nusukId, setNusukId] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [crCopyUrl, setCrCopyUrl] = useState<string | null>(null);
  const [tourismLicenseUrl, setTourismLicenseUrl] = useState<string | null>(null);
  const [vatCertificateUrl, setVatCertificateUrl] = useState<string | null>(null);
  const [crExpiry, setCrExpiry] = useState("");
  const [tourismLicenseExpiry, setTourismLicenseExpiry] = useState("");
  const [signatoryIdUrl, setSignatoryIdUrl] = useState<string | null>(null);
  const [articlesOfAssociationUrl, setArticlesOfAssociationUrl] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [swiftBicCode, setSwiftBicCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [nationalAddress, setNationalAddress] = useState("");
  const [motLicenseUrl, setMotLicenseUrl] = useState<string | null>(null);
  const [civilDefenseCertUrl, setCivilDefenseCertUrl] = useState<string | null>(null);
  const [civilDefenseExpiry, setCivilDefenseExpiry] = useState("");
  const [mohuLicenseUrl, setMohuLicenseUrl] = useState<string | null>(null);
  const [bankGuaranteeUrl, setBankGuaranteeUrl] = useState<string | null>(null);
  const [iataNumber, setIataNumber] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (compliance && !initialized) {
    setCrNumber(compliance.crNumber || "");
    setTourismLicense(compliance.tourismLicense || "");
    setNusukId(compliance.nusukId || "");
    setVatNumber(compliance.vatNumber || "");
    setCrCopyUrl(compliance.crCopyUrl || null);
    setTourismLicenseUrl(compliance.tourismLicenseUrl || null);
    setVatCertificateUrl(compliance.vatCertificateUrl || null);
    setCrExpiry(compliance.crExpiry || "");
    setTourismLicenseExpiry(compliance.tourismLicenseExpiry || "");
    setSignatoryIdUrl(compliance.signatoryIdUrl || null);
    setArticlesOfAssociationUrl(compliance.articlesOfAssociationUrl || null);
    setBankName(compliance.bankName || "");
    setIban(compliance.iban || "");
    setBeneficiaryName(compliance.beneficiaryName || "");
    setSwiftBicCode(compliance.swiftBicCode || "");
    setAgreedToTerms(compliance.agreedToTerms || false);
    setNationalAddress(compliance.nationalAddress || "");
    setMotLicenseUrl(compliance.motLicenseUrl || null);
    setCivilDefenseCertUrl(compliance.civilDefenseCertUrl || null);
    setCivilDefenseExpiry(compliance.civilDefenseExpiry || "");
    setMohuLicenseUrl(compliance.mohuLicenseUrl || null);
    setBankGuaranteeUrl(compliance.bankGuaranteeUrl || null);
    setIataNumber(compliance.iataNumber || "");
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", "/api/agent/compliance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/compliance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("compliance.saved") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const ibanValid = !iban || SA_IBAN_REGEX.test(iban);
  const crExpiryPast = isDateInPast(crExpiry);
  const licenseExpiryPast = isDateInPast(tourismLicenseExpiry);
  const civilDefenseExpiryPast = isDateInPast(civilDefenseExpiry);
  const crValid = !crNumber || /^\d{10}$/.test(crNumber);
  const nationalAddressValid = !nationalAddress || nationalAddress.length === 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast({ title: t("common.error"), description: t("compliance.mustAgree"), variant: "destructive" });
      return;
    }

    if (!crValid) {
      toast({ title: t("common.error"), description: t("compliance.crMustBe10Digits"), variant: "destructive" });
      return;
    }

    if (!nationalAddressValid) {
      toast({ title: t("common.error"), description: t("compliance.nationalAddressMustBe8"), variant: "destructive" });
      return;
    }

    if (iban && !ibanValid) {
      toast({ title: t("common.error"), description: t("compliance.ibanInvalid"), variant: "destructive" });
      return;
    }

    if (crExpiryPast) {
      toast({ title: t("common.error"), description: `${t("compliance.crExpiry")}: ${t("compliance.dateInPast")}`, variant: "destructive" });
      return;
    }

    if (licenseExpiryPast) {
      toast({ title: t("common.error"), description: `${t("compliance.licenseExpiry")}: ${t("compliance.dateInPast")}`, variant: "destructive" });
      return;
    }

    if (civilDefenseExpiryPast) {
      toast({ title: t("common.error"), description: `${t("compliance.civilDefenseExpiry")}: ${t("compliance.dateInPast")}`, variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      crNumber, tourismLicense, nusukId, vatNumber,
      crCopyUrl, tourismLicenseUrl, vatCertificateUrl,
      crExpiry, tourismLicenseExpiry,
      signatoryIdUrl, articlesOfAssociationUrl,
      bankName, iban, beneficiaryName, swiftBicCode,
      agreedToTerms, nationalAddress,
      motLicenseUrl, civilDefenseCertUrl, civilDefenseExpiry,
      mohuLicenseUrl, bankGuaranteeUrl, iataNumber,
    });
  };

  const statusConfig: Record<string, { icon: any; bg: string; border: string; text: string; iconBg: string; iconText: string; label: string; glow: string }> = {
    PENDING: { icon: Clock, bg: "bg-amber-50 dark:bg-amber-500/15", border: "border-amber-200 dark:border-amber-500/30", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500", iconText: "text-white", label: t("compliance.statusPending"), glow: "shadow-amber-500/10" },
    VERIFIED: { icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-500/15", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500", iconText: "text-white", label: t("compliance.statusVerified"), glow: "shadow-emerald-500/10" },
    REJECTED: { icon: XCircle, bg: "bg-red-50 dark:bg-red-500/15", border: "border-red-200 dark:border-red-500/30", text: "text-red-600 dark:text-red-400", iconBg: "bg-red-500", iconText: "text-white", label: t("compliance.statusRejected"), glow: "shadow-red-500/10" },
  };

  const currentStatus = statusConfig[compliance?.verificationStatus || "PENDING"];
  const StatusIcon = currentStatus.icon;

  const todayStr = new Date().toISOString().split("T")[0];

  const commonItems = [
    { label: "CR Number", done: !!crNumber },
    { label: "CR Document", done: !!crCopyUrl },
    { label: "VAT Number", done: !!vatNumber },
    { label: "National Address", done: !!nationalAddress },
  ];

  const hotelItems = [
    { label: "MoT License", done: !!motLicenseUrl },
    { label: "Civil Defense Cert", done: !!civilDefenseCertUrl },
    { label: "Nusuk ID", done: !!nusukId },
  ];

  const brokerItems = [
    { label: "MoHU License", done: !!mohuLicenseUrl },
    { label: "Bank Guarantee", done: !!bankGuaranteeUrl },
    { label: "IATA Number", done: !!iataNumber },
  ];

  const agentItems = [
    { label: "Tourism License", done: !!tourismLicense },
    { label: "License Document", done: !!tourismLicenseUrl },
    { label: "Nusuk ID", done: !!nusukId },
    { label: "VAT Certificate", done: !!vatCertificateUrl },
    { label: "Signatory ID", done: !!signatoryIdUrl },
    { label: "Articles of Assoc.", done: !!articlesOfAssociationUrl },
  ];

  const bankItems = [
    { label: "Bank Details", done: !!(bankName && iban && beneficiaryName) },
    { label: "Swift/BIC", done: !!swiftBicCode },
    { label: "Terms Agreed", done: !!agreedToTerms },
  ];

  const roleItems = user?.role === "HOTEL" ? hotelItems : user?.role === "BROKER" ? brokerItems : agentItems;
  const completionItems = [...commonItems, ...roleItems, ...bankItems];

  const crInvalid = !/^\d{10}$/.test(crNumber) && crNumber.length > 0;
  const nationalAddressInvalid = nationalAddress.length !== 8 && nationalAddress.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-[#e8eff6] via-[#dce6f0] to-[#e8eff6] dark:from-[#1C2530] dark:via-[#243040] dark:to-[#1C2530] p-8 border border-slate-200 dark:border-[#D4AF37]/15 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground" data-testid="text-compliance-title">
                    {t("compliance.title")}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-0.5 font-normal tracking-normal">{t("compliance.subtitle")}</p>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${currentStatus.bg} ${currentStatus.border} border shadow-lg ${currentStatus.glow}`}>
              <div className={`w-8 h-8 rounded-lg ${currentStatus.iconBg} flex items-center justify-center shadow-sm`}>
                <StatusIcon className={`w-4 h-4 ${currentStatus.iconText}`} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">{t("compliance.verificationStatus")}</div>
                <div className={`text-sm font-semibold ${currentStatus.text}`} data-testid="badge-verification-status">
                  {currentStatus.label}
                </div>
              </div>
            </div>
          </div>

          {!isLoading && (
            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/5">
              <CompletionTracker items={completionItems} />
            </div>
          )}
        </div>
      </div>

      {compliance?.verificationStatus === "REJECTED" && compliance?.rejectionReason && (
        <Card className="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">{t("compliance.rejectionReason")}</h3>
                <p className="text-sm text-red-600/80 dark:text-red-300/80 leading-relaxed" data-testid="text-rejection-reason">{compliance.rejectionReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card/80 border-border/50">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#D4AF37]" />
            <CardHeader className="pb-4 pt-7 px-6">
              <CardTitle className="flex items-center gap-3 text-lg text-foreground tracking-[-0.01em]">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8932D] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 ring-4 ring-[#D4AF37]/10 -translate-y-0.5">
                  <Building2 className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                {t("compliance.commonDocuments")}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">{t("compliance.commonDocumentsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-6 pb-6 pt-0">
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-border/30">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-foreground">Commercial Registration</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crNumber" className="text-sm text-foreground/70">{t("compliance.crNumber")}</Label>
                  <Input
                    id="crNumber"
                    placeholder={t("compliance.crPlaceholder")}
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    className={`bg-slate-50 dark:bg-card h-10 rounded-lg ${crInvalid ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50"}`}
                    data-testid="input-cr-number"
                  />
                  {crInvalid && (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t("compliance.crMustBe10Digits")}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUploadField
                    label={t("compliance.crCopy")}
                    currentUrl={crCopyUrl}
                    onUploaded={setCrCopyUrl}
                    testId="cr-copy"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="crExpiry" className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {t("compliance.crExpiry")}
                    </Label>
                    <Input
                      id="crExpiry"
                      type="date"
                      min={todayStr}
                      value={crExpiry}
                      onChange={(e) => setCrExpiry(e.target.value)}
                      className={`bg-slate-50 dark:bg-card h-10 rounded-lg ${crExpiryPast ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50"}`}
                      data-testid="input-cr-expiry"
                    />
                    {crExpiryPast && (
                      <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t("compliance.dateInPast")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-border/30">
                  <Hash className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-foreground">Tax & Address</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber" className="text-sm text-foreground/70">{t("compliance.vatNumber")}</Label>
                    <Input
                      id="vatNumber"
                      placeholder={t("compliance.vatPlaceholder")}
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                      data-testid="input-vat-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalAddress" className="text-sm text-foreground/70">{t("compliance.nationalAddress")}</Label>
                    <Input
                      id="nationalAddress"
                      placeholder={t("compliance.nationalAddressPlaceholder")}
                      value={nationalAddress}
                      onChange={(e) => setNationalAddress(e.target.value)}
                      className={`bg-slate-50 dark:bg-card h-10 rounded-lg ${nationalAddressInvalid ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50"}`}
                      data-testid="input-national-address"
                    />
                    {nationalAddressInvalid && (
                      <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t("compliance.nationalAddressMustBe8")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.role === "HOTEL" && (
            <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
              <CardHeader className="pb-4 pt-7 px-6">
                <CardTitle className="flex items-center gap-3 text-lg text-foreground tracking-[-0.01em]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/10 dark:ring-amber-400/10 -translate-y-0.5">
                    <Building2 className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                  {t("compliance.hotelDocuments")}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-1">{t("compliance.hotelDocumentsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUploadField
                    label={t("compliance.motLicense")}
                    currentUrl={motLicenseUrl}
                    onUploaded={setMotLicenseUrl}
                    testId="mot-license"
                  />
                  <FileUploadField
                    label={t("compliance.civilDefenseCert")}
                    currentUrl={civilDefenseCertUrl}
                    onUploaded={setCivilDefenseCertUrl}
                    testId="civil-defense-cert"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="civilDefenseExpiry" className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {t("compliance.civilDefenseExpiry")}
                    </Label>
                    <Input
                      id="civilDefenseExpiry"
                      type="date"
                      min={todayStr}
                      value={civilDefenseExpiry}
                      onChange={(e) => setCivilDefenseExpiry(e.target.value)}
                      className={`bg-slate-50 dark:bg-card h-10 rounded-lg ${civilDefenseExpiryPast ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50"}`}
                      data-testid="input-civil-defense-expiry"
                    />
                    {civilDefenseExpiryPast && (
                      <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t("compliance.dateInPast")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nusukId" className="text-sm text-foreground/70">{t("compliance.nusukId")}</Label>
                    <Input
                      id="nusukId"
                      placeholder={t("compliance.nusukPlaceholder")}
                      value={nusukId}
                      onChange={(e) => setNusukId(e.target.value)}
                      className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                      data-testid="input-nusuk-id"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.role === "BROKER" && (
            <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400" />
              <CardHeader className="pb-4 pt-7 px-6">
                <CardTitle className="flex items-center gap-3 text-lg text-foreground tracking-[-0.01em]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/10 dark:ring-purple-400/10 -translate-y-0.5">
                    <Briefcase className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                  {t("compliance.brokerDocuments")}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-1">{t("compliance.brokerDocumentsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUploadField
                    label={t("compliance.mohuLicense")}
                    currentUrl={mohuLicenseUrl}
                    onUploaded={setMohuLicenseUrl}
                    testId="mohu-license"
                  />
                  <FileUploadField
                    label={t("compliance.bankGuarantee")}
                    currentUrl={bankGuaranteeUrl}
                    onUploaded={setBankGuaranteeUrl}
                    testId="bank-guarantee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iataNumber" className="text-sm text-foreground/70">{t("compliance.iataNumber")}</Label>
                  <Input
                    id="iataNumber"
                    placeholder={t("compliance.iataPlaceholder")}
                    value={iataNumber}
                    onChange={(e) => setIataNumber(e.target.value)}
                    className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                    data-testid="input-iata-number"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {user?.role === "AGENT" && (
            <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400" />
              <CardHeader className="pb-4 pt-7 px-6">
                <CardTitle className="flex items-center gap-3 text-lg text-foreground tracking-[-0.01em]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/10 dark:ring-rose-400/10 -translate-y-0.5">
                    <FileText className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                  {t("compliance.documents")}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-1">{t("compliance.documentsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 pb-6 pt-0">
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-border/30">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-foreground">Tourism License</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tourismLicense" className="text-sm text-foreground/70">{t("compliance.tourismLicense")}</Label>
                    <Input
                      id="tourismLicense"
                      placeholder={t("compliance.licensePlaceholder")}
                      value={tourismLicense}
                      onChange={(e) => setTourismLicense(e.target.value)}
                      className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                      data-testid="input-tourism-license"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FileUploadField
                      label={t("compliance.tourismLicenseFile")}
                      currentUrl={tourismLicenseUrl}
                      onUploaded={setTourismLicenseUrl}
                      testId="tourism-license"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="tourismLicenseExpiry" className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {t("compliance.licenseExpiry")}
                      </Label>
                      <Input
                        id="tourismLicenseExpiry"
                        type="date"
                        min={todayStr}
                        value={tourismLicenseExpiry}
                        onChange={(e) => setTourismLicenseExpiry(e.target.value)}
                        className={`bg-slate-50 dark:bg-card h-10 rounded-lg ${licenseExpiryPast ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50"}`}
                        data-testid="input-license-expiry"
                      />
                      {licenseExpiryPast && (
                        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {t("compliance.dateInPast")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-border/30">
                    <Hash className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-foreground">Platform Registration</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="nusukId" className="text-sm text-foreground/70">{t("compliance.nusukId")}</Label>
                      <Input
                        id="nusukId"
                        placeholder={t("compliance.nusukPlaceholder")}
                        value={nusukId}
                        onChange={(e) => setNusukId(e.target.value)}
                        className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                        data-testid="input-nusuk-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber-agent" className="text-sm text-foreground/70">{t("compliance.vatNumber")}</Label>
                      <Input
                        id="vatNumber-agent"
                        placeholder={t("compliance.vatPlaceholder")}
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-[#D4AF37]/50 h-10 rounded-lg"
                        data-testid="input-vat-number-agent"
                      />
                    </div>
                  </div>
                  <FileUploadField
                    label={t("compliance.vatCertificate")}
                    currentUrl={vatCertificateUrl}
                    onUploaded={setVatCertificateUrl}
                    testId="vat-certificate"
                  />
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-border/30">
                    <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-foreground">Legal Documents</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FileUploadField
                      label={t("compliance.signatoryId")}
                      currentUrl={signatoryIdUrl}
                      onUploaded={setSignatoryIdUrl}
                      testId="signatory-id"
                    />
                    <FileUploadField
                      label={t("compliance.articlesOfAssociation")}
                      currentUrl={articlesOfAssociationUrl}
                      onUploaded={setArticlesOfAssociationUrl}
                      testId="articles-of-association"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400" />
            <CardHeader className="pb-4 pt-7 px-6">
              <CardTitle className="flex items-center gap-3 text-lg text-foreground tracking-[-0.01em]">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 ring-4 ring-sky-500/10 dark:ring-sky-400/10 -translate-y-0.5">
                  <Landmark className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                {t("compliance.bankDetails")}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">{t("compliance.bankDetailsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 space-y-5">
              {isImpersonating ? (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">Bank details are hidden during impersonation for security. Only the account holder can view and edit this information.</p>
                </div>
              ) : (
                <>
              <div className="space-y-2">
                <Label htmlFor="bankName" className="flex items-center gap-1.5 text-sm text-foreground/70">
                  <Landmark className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  {t("compliance.bankName")}
                </Label>
                <Input
                  id="bankName"
                  placeholder={t("compliance.bankNamePlaceholder")}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-emerald-500/50 h-10 rounded-lg"
                  data-testid="input-bank-name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="iban" className="flex items-center gap-1.5 text-sm text-foreground/70">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    {t("compliance.iban")}
                  </Label>
                  <Input
                    id="iban"
                    placeholder="SA0000000000000000000000"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    maxLength={24}
                    className={`bg-slate-50 dark:bg-card font-mono text-sm h-10 rounded-lg ${iban && !ibanValid ? "border-red-500 focus-visible:ring-red-500 text-red-400" : "border-slate-200 dark:border-border/50 focus:border-emerald-500/50"}`}
                    data-testid="input-iban"
                  />
                  {iban && !ibanValid ? (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t("compliance.ibanInvalid")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("compliance.ibanHint")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="swiftBicCode" className="flex items-center gap-1.5 text-sm text-foreground/70">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    {t("compliance.swiftBicCode")}
                  </Label>
                  <Input
                    id="swiftBicCode"
                    placeholder={t("compliance.swiftBicPlaceholder")}
                    value={swiftBicCode}
                    onChange={(e) => setSwiftBicCode(e.target.value.toUpperCase())}
                    maxLength={11}
                    className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-emerald-500/50 font-mono text-sm h-10 rounded-lg"
                    data-testid="input-swift-bic"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiaryName" className="flex items-center gap-1.5 text-sm text-foreground/70">
                  <User className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  {t("compliance.beneficiaryName")}
                </Label>
                <Input
                  id="beneficiaryName"
                  placeholder={t("compliance.beneficiaryPlaceholder")}
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="bg-slate-50 dark:bg-card border-slate-200 dark:border-border/50 focus:border-emerald-500/50 h-10 rounded-lg"
                  data-testid="input-beneficiary"
                />
              </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card/80 border-slate-200 dark:border-border/50 shadow-sm rounded-2xl overflow-hidden relative group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#D4AF37]" />
            <CardContent className="p-6 pt-7">
              <div className="flex items-start gap-4">
                <Checkbox
                  id="agreeTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(!!v)}
                  className="mt-1 h-5 w-5 border-slate-300 dark:border-border data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                  data-testid="checkbox-agree-terms"
                />
                <div className="flex-1 space-y-3">
                  <Label htmlFor="agreeTerms" className="text-sm cursor-pointer leading-relaxed text-foreground">
                    {t("compliance.agreementText")}
                  </Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {compliance?.agreementDate && (
                      <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium" data-testid="text-agreement-date">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("compliance.agreedOn")}: {new Date(compliance.agreementDate).toLocaleDateString()}
                      </div>
                    )}
                    <a
                      href="/escrow-policy"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 font-medium transition-colors"
                      data-testid="link-view-escrow-policy"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {t("compliance.viewEscrowPolicy") || "View 80/20 Escrow Policy"}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C9A032] hover:from-[#C9A032] hover:to-[#B8932D] text-[#1C2530] font-semibold text-base shadow-lg shadow-[#D4AF37]/15 transition-all rounded-xl"
            disabled={updateMutation.isPending || !agreedToTerms || (iban !== "" && !ibanValid) || crExpiryPast || licenseExpiryPast || civilDefenseExpiryPast || !crValid || !nationalAddressValid}
            data-testid="button-save-compliance"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {t("compliance.saveDocuments")}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
