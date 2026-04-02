import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ShieldCheck, ShieldX, Clock, FileSearch, CheckCircle2, XCircle, Loader2, Users,
  ExternalLink, Landmark, Calendar, FileCheck, AlertTriangle, Ban
} from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "default",
  VERIFIED: "secondary",
  REJECTED: "destructive",
};

const roleColors: Record<string, string> = {
  HOTEL: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BROKER: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  AGENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function getDocsCount(user: any): { count: number; total: number } {
  const role = user.role;
  if (role === "HOTEL") {
    return {
      count: [user.crCopyUrl, user.motLicenseUrl, user.civilDefenseCertUrl].filter(Boolean).length,
      total: 3,
    };
  }
  if (role === "BROKER") {
    return {
      count: [user.crCopyUrl, user.mohuLicenseUrl, user.bankGuaranteeUrl].filter(Boolean).length,
      total: 3,
    };
  }
  return {
    count: [user.crCopyUrl, user.tourismLicenseUrl, user.vatCertificateUrl].filter(Boolean).length,
    total: 3,
  };
}

export default function AdminVerificationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/verification-queue"],
  });

  const allUsers = users || [];
  const filteredUsers = roleFilter === "ALL" ? allUsers : allUsers.filter(u => u.role === roleFilter);

  const pending = allUsers.filter(a => a.verificationStatus === "PENDING");
  const verified = allUsers.filter(a => a.verificationStatus === "VERIFIED");
  const rejected = allUsers.filter(a => a.verificationStatus === "REJECTED");

  const filterTabs = [
    { key: "ALL", label: t("verification.allRoles") },
    { key: "HOTEL", label: t("verification.hotels") },
    { key: "BROKER", label: t("verification.brokers") },
    { key: "AGENT", label: t("verification.agents") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-verification-title">{t("verification.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("verification.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-8 w-20" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground font-medium">{t("verification.pending")}</p>
                </div>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{pending.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground font-medium">{t("verification.verified")}</p>
                </div>
                <p className="text-2xl font-bold" data-testid="text-verified-count">{verified.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-muted-foreground font-medium">{t("verification.rejected")}</p>
                </div>
                <p className="text-2xl font-bold" data-testid="text-rejected-count">{rejected.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2 flex-wrap" data-testid="role-filter-tabs">
            {filterTabs.map(tab => (
              <Button
                key={tab.key}
                size="sm"
                variant={roleFilter === tab.key ? "default" : "outline"}
                className={roleFilter === tab.key ? "toggle-elevate toggle-elevated" : ""}
                onClick={() => setRoleFilter(tab.key)}
                data-testid={`button-filter-${tab.key.toLowerCase()}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                {t("verification.agentList")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Users className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">{t("verification.noAgents")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.users.businessName")}</TableHead>
                      <TableHead>{t("verification.role")}</TableHead>
                      <TableHead>{t("compliance.crNumber")}</TableHead>
                      <TableHead>{t("verification.docs")}</TableHead>
                      <TableHead>{t("verification.status")}</TableHead>
                      <TableHead className="text-right">{t("admin.users.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => {
                      const initials = user.businessName
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      const docs = getDocsCount(user);
                      return (
                        <TableRow key={user.id} data-testid={`row-agent-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.businessName}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${roleColors[user.role] || ""}`} data-testid={`badge-role-${user.id}`}>
                              {user.role}
                            </Badge>
                            {user.suspendedAt && (
                              <Badge variant="destructive" className="text-xs ms-1">
                                <Ban className="w-3 h-3 me-1" />
                                {t("verification.suspendedLicense")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {user.crNumber || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={docs.count > 0 ? "secondary" : "outline"} className="text-xs">
                              <FileCheck className="w-3 h-3 me-1" />
                              {docs.count}/{docs.total}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[user.verificationStatus] as any}>
                              {user.verificationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-review-${user.id}`}
                            >
                              <FileSearch className="w-3 h-3 me-1" />
                              {t("verification.review")}
                            </Button>
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

      {selectedUser && (
        <VerificationDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function DocumentLink({ label, url, testId }: { label: string; url: string | null; testId: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <XCircle className="w-3 h-3" />
        <span>{label}: Not uploaded</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      data-testid={testId}
    >
      <ExternalLink className="w-3 h-3" />
      <span>{label}</span>
      <CheckCircle2 className="w-3 h-3 text-green-500" />
    </a>
  );
}

function VerificationDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [crValid, setCrValid] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [check4, setCheck4] = useState(false);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const role = user.role;

  const allChecked = role === "AGENT" ? crValid && check2 && check3 && check4 : crValid && check2 && check3;

  const verifyMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason?: string }) => {
      const body: any = { status };
      if (status === "REJECTED" && reason) {
        body.rejectionReason = reason;
      }
      await apiRequest("POST", `/api/admin/verify-agent/${user.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("verification.updated") });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const getChecklist = () => {
    if (role === "HOTEL") {
      return [
        { id: "cr", label: t("verification.checkCr"), checked: crValid, onChange: setCrValid, value: user.crNumber },
        { id: "mot", label: t("verification.checkMotLicense"), checked: check2, onChange: setCheck2, value: user.motLicenseUrl },
        { id: "civil", label: t("verification.checkCivilDefense"), checked: check3, onChange: setCheck3, value: user.civilDefenseCertUrl },
      ];
    }
    if (role === "BROKER") {
      return [
        { id: "cr", label: t("verification.checkCr"), checked: crValid, onChange: setCrValid, value: user.crNumber },
        { id: "mohu", label: t("verification.checkMohuLicense"), checked: check2, onChange: setCheck2, value: user.mohuLicenseUrl },
        { id: "bank", label: t("verification.checkBankGuarantee"), checked: check3, onChange: setCheck3, value: user.bankGuaranteeUrl },
      ];
    }
    return [
      { id: "cr", label: t("verification.checkCr"), checked: crValid, onChange: setCrValid, value: user.crNumber },
      { id: "license", label: t("verification.checkLicense"), checked: check2, onChange: setCheck2, value: user.tourismLicense },
      { id: "nusuk", label: t("verification.checkNusuk"), checked: check3, onChange: setCheck3, value: user.nusukId },
      { id: "iata", label: t("verification.checkIata"), checked: check4, onChange: setCheck4, value: null },
    ];
  };

  const checklist = getChecklist();

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: t("verification.rejectReasonRequired"), variant: "destructive" });
      return;
    }
    verifyMutation.mutate({ status: "REJECTED", reason: rejectionReason });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            {t("verification.reviewAgent")}: {user.businessName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            {user.email}
            <Badge variant="outline" className={`text-xs ${roleColors[role] || ""}`}>{role}</Badge>
            {user.suspendedAt && (
              <Badge variant="destructive" className="text-xs">
                <Ban className="w-3 h-3 me-1" />
                {t("verification.suspendedLicense")}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold">{t("verification.userInfo")}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t("compliance.crNumber")}</p>
                <p className="text-sm font-mono" data-testid="text-agent-cr">{user.crNumber || "—"}</p>
                {user.crExpiry && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {t("compliance.expires")}: {user.crExpiry}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t("compliance.vatNumber")}</p>
                <p className="text-sm font-mono" data-testid="text-agent-vat">{user.vatNumber || "—"}</p>
              </div>
            </div>

            {user.nationalAddress && (
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="text-xs text-muted-foreground font-medium">National Address</p>
                <p className="text-sm" data-testid="text-user-national-address">{user.nationalAddress}</p>
              </div>
            )}

            {role === "HOTEL" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">MoT License</p>
                  <p className="text-sm font-mono" data-testid="text-user-mot-license">{user.motLicenseUrl ? "Uploaded" : "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Civil Defense Expiry</p>
                  <p className="text-sm font-mono" data-testid="text-user-civil-defense-expiry">{user.civilDefenseExpiry || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t("compliance.nusukId")}</p>
                  <p className="text-sm font-mono" data-testid="text-agent-nusuk">{user.nusukId || "—"}</p>
                </div>
              </div>
            )}

            {role === "BROKER" && (
              <div className="p-3 rounded-lg bg-muted space-y-1">
                <p className="text-xs text-muted-foreground font-medium">IATA Number</p>
                <p className="text-sm font-mono" data-testid="text-user-iata">{user.iataNumber || "—"}</p>
              </div>
            )}

            {role === "AGENT" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t("compliance.tourismLicense")}</p>
                  <p className="text-sm font-mono" data-testid="text-agent-license">{user.tourismLicense || "—"}</p>
                  {user.tourismLicenseExpiry && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {t("compliance.expires")}: {user.tourismLicenseExpiry}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t("compliance.nusukId")}</p>
                  <p className="text-sm font-mono" data-testid="text-agent-nusuk">{user.nusukId || "—"}</p>
                </div>
              </div>
            )}

            {(user.bankName || user.iban || user.beneficiaryName) && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  {t("compliance.bankDetails")}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t("compliance.bankName")}</p>
                    <p className="font-medium" data-testid="text-agent-bank">{user.bankName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("compliance.iban")}</p>
                    <p className="font-mono font-medium" data-testid="text-agent-iban">{user.iban ? user.iban.slice(0, 4) + "••••••••••••" + user.iban.slice(-4) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("compliance.beneficiaryName")}</p>
                    <p className="font-medium" data-testid="text-agent-beneficiary">{user.beneficiaryName || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {user.agreedToTerms && (
              <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 p-2 rounded-lg">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t("compliance.termsAgreed")}</span>
                {user.agreementDate && (
                  <span className="text-muted-foreground">({new Date(user.agreementDate).toLocaleDateString()})</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">{t("verification.documentReview")}</p>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                {t("verification.uploadedDocs")}
              </p>
              <div className="space-y-2">
                {role === "HOTEL" && (
                  <>
                    <DocumentLink label={t("compliance.crCopy")} url={user.crCopyUrl} testId="link-admin-cr-copy" />
                    <DocumentLink label="MoT License" url={user.motLicenseUrl} testId="link-admin-mot-license" />
                    <DocumentLink label="Civil Defense Cert" url={user.civilDefenseCertUrl} testId="link-admin-civil-defense" />
                  </>
                )}
                {role === "BROKER" && (
                  <>
                    <DocumentLink label={t("compliance.crCopy")} url={user.crCopyUrl} testId="link-admin-cr-copy" />
                    <DocumentLink label="MoHU License" url={user.mohuLicenseUrl} testId="link-admin-mohu-license" />
                    <DocumentLink label="Bank Guarantee" url={user.bankGuaranteeUrl} testId="link-admin-bank-guarantee" />
                  </>
                )}
                {role === "AGENT" && (
                  <>
                    <DocumentLink label={t("compliance.crCopy")} url={user.crCopyUrl} testId="link-admin-cr-copy" />
                    <DocumentLink label={t("compliance.tourismLicenseFile")} url={user.tourismLicenseUrl} testId="link-admin-tourism-license" />
                    <DocumentLink label={t("compliance.vatCertificate")} url={user.vatCertificateUrl} testId="link-admin-vat-cert" />
                    <DocumentLink label="Signatory ID" url={user.signatoryIdUrl} testId="link-admin-signatory-id" />
                    <DocumentLink label="Articles of Association" url={user.articlesUrl} testId="link-admin-articles" />
                  </>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold">{t("verification.checklist")}</p>
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(v) => item.onChange(!!v)}
                    data-testid={`checkbox-${item.id}`}
                  />
                  <Label htmlFor={`check-${item.id}`} className="text-sm flex-1 cursor-pointer">
                    {item.label}
                  </Label>
                  {item.value !== null && (
                    item.value ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )
                  )}
                </div>
              ))}
            </div>

            {user.rejectionReason && (
              <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4 space-y-2" data-testid="card-previous-rejection">
                <p className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  {t("verification.previousRejection")}
                </p>
                <p className="text-xs text-amber-300/80">{user.rejectionReason}</p>
              </div>
            )}

            {!showRejectForm ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!allChecked || verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ status: "VERIFIED" })}
                  data-testid="button-approve-agent"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 me-1" />
                      {t("verification.approve")}
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={verifyMutation.isPending}
                  onClick={() => setShowRejectForm(true)}
                  data-testid="button-reject-agent"
                >
                  <ShieldX className="w-4 h-4 me-1" />
                  {t("verification.reject")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                <Label className="text-sm font-semibold">{t("verification.rejectionReasonLabel")}</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("verification.rejectionReasonPlaceholder")}
                  className="resize-none text-sm"
                  rows={3}
                  data-testid="textarea-rejection-reason"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={verifyMutation.isPending}
                    onClick={handleReject}
                    data-testid="button-confirm-reject"
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldX className="w-4 h-4 me-1" />
                        {t("verification.reject")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowRejectForm(false); setRejectionReason(""); }}
                    data-testid="button-cancel-reject"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
