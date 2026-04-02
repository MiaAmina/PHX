import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, XCircle, FileCheck } from "lucide-react";
import type { ReactNode } from "react";

export function VerificationGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (!user || user.role === "ADMIN") {
    return <>{children}</>;
  }

  if ((user as any).verificationStatus === "VERIFIED") {
    return <>{children}</>;
  }

  const isRejected = (user as any).verificationStatus === "REJECTED";

  const getTitleKey = () => {
    if (user.role === "HOTEL") return "compliance.gateHotelTitle";
    if (user.role === "BROKER") return "compliance.gateBrokerTitle";
    return "compliance.gateTitle";
  };

  const getMessageKey = () => {
    if (isRejected) return "compliance.gateRejected";
    if (user.role === "HOTEL") return "compliance.gateHotelMessage";
    if (user.role === "BROKER") return "compliance.gateBrokerMessage";
    return "compliance.gateMessage";
  };

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-40" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-20 z-10">
        <Card className="max-w-md w-full mx-4 shadow-2xl border-2" data-testid="card-verification-gate">
          <CardContent className="p-8 text-center space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isRejected ? "bg-red-500/10" : "bg-amber-500/10"
            }`}>
              {isRejected ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : (
                <Clock className="w-8 h-8 text-amber-500" />
              )}
            </div>
            <h2 className="text-xl font-bold" data-testid="text-gate-title">
              {t(getTitleKey())}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(getMessageKey())}
            </p>
            <Button
              onClick={() => setLocation("/agent/compliance")}
              className="bg-gold text-gold-foreground border-gold"
              data-testid="button-go-compliance"
            >
              <FileCheck className="w-4 h-4 me-2" />
              {t("compliance.goToCompliance")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
