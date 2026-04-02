import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  Clock,
  Snowflake,
  ArrowDown,
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

export default function EscrowPolicyPage() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      title: t("escrow.step1Title") || "Agent Books Rooms",
      description: t("escrow.step1Desc") || "When an agent books rooms from a broker, the full payment (including VAT) is placed into escrow. No funds go directly to the broker or hotel at this stage.",
      status: t("escrow.inEscrow") || "In Escrow",
      statusColor: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    },
    {
      icon: Building2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      title: t("escrow.step2Title") || "Hotel Confirms Check-In",
      description: t("escrow.step2Desc") || "When the hotel confirms that pilgrims have checked in, 80% of the escrow amount is released to the hotel. The remaining 20% is held until the stay is completed.",
      status: t("escrow.milestone1") || "80% Released",
      statusColor: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      title: t("escrow.step3Title") || "Stay Completed",
      description: t("escrow.step3Desc") || "After the stay is completed without disputes, the remaining 20% is released to the hotel. The booking is marked as settled.",
      status: t("escrow.settled") || "Settled",
      statusColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" data-testid="text-escrow-policy-title">
          <Shield className="w-6 h-6 text-[#D4AF37]" />
          {t("escrow.policyTitle") || "Escrow Policy"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("escrow.policySubtitle") || "How your payments are protected through our secure escrow system"}
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("escrow.howItWorks") || "How Escrow Works"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {steps.map((step, i) => (
            <div key={i}>
              <div className={`rounded-lg border ${step.border} p-4`} data-testid={`escrow-step-${i + 1}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${step.bg} shrink-0 mt-0.5`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">Step {i + 1}</span>
                      <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                    <Badge variant="outline" className={`text-xs mt-2 ${step.statusColor}`}>
                      {step.status}
                    </Badge>
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-red-400" />
            {t("escrow.disputeTitle") || "Disputes & Frozen Funds"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">{t("escrow.disputeHeading") || "What happens when a dispute is filed?"}</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1.5 list-disc list-inside">
                  <li>{t("escrow.dispute1") || "The remaining escrow balance is immediately frozen"}</li>
                  <li>{t("escrow.dispute2") || "Platform admin is notified and reviews the case"}</li>
                  <li>{t("escrow.dispute3") || "Neither party can withdraw funds until resolved"}</li>
                  <li>{t("escrow.dispute4") || "Admin determines the fair resolution and releases funds accordingly"}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {t("escrow.timelineTitle") || "Payment Timeline"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">100%</div>
              <p className="text-xs text-muted-foreground mt-1">{t("escrow.heldOnBooking") || "Held on booking"}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">80%</div>
              <p className="text-xs text-muted-foreground mt-1">{t("escrow.releasedOnCheckin") || "Released on check-in"}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">20%</div>
              <p className="text-xs text-muted-foreground mt-1">{t("escrow.releasedOnCompletion") || "Released on completion"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("escrow.faqTitle") || "Key Points"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("escrow.faq1Title") || "Who holds the funds?"}</p>
                <p className="text-xs text-muted-foreground">{t("escrow.faq1Desc") || "PHX Exchange holds all escrow funds in a segregated account. Neither the hotel, broker, nor agent can access the funds until the escrow conditions are met."}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("escrow.faq2Title") || "Is my payment safe?"}</p>
                <p className="text-xs text-muted-foreground">{t("escrow.faq2Desc") || "Yes. The escrow system ensures funds are only released when services are delivered. If there is a problem, you can file a dispute and the funds will be frozen until resolution."}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("escrow.faq3Title") || "When does the hotel get paid?"}</p>
                <p className="text-xs text-muted-foreground">{t("escrow.faq3Desc") || "Hotels receive 80% when they confirm guest check-in, and the remaining 20% after the stay is completed. This ensures hotels are incentivized to deliver quality service."}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
