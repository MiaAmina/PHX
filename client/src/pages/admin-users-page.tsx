import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, LogIn, ShieldCheck, ShieldX, UsersRound, Send, BedDouble, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";

const roleColors: Record<string, string> = {
  ADMIN: "destructive",
  HOTEL: "default",
  BROKER: "secondary",
  AGENT: "outline",
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });
  const { impersonate } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [groupBroker, setGroupBroker] = useState<any>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/verify`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("admin.users.verificationUpdated") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const handleImpersonate = async (userId: string, businessName: string) => {
    try {
      await impersonate(userId);
      toast({ title: `Now impersonating ${businessName}` });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
  };

  const stats = users ? {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    hotels: users.filter(u => u.role === "HOTEL").length,
    brokers: users.filter(u => u.role === "BROKER").length,
    agents: users.filter(u => u.role === "AGENT").length,
  } : null;

  const brokers = (users || []).filter(u => u.role === "BROKER");
  const agents = (users || []).filter(u => u.role === "AGENT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">{t("admin.users.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("admin.users.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !users || users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("admin.users.noUsers")}</h3>
            <p className="text-muted-foreground max-w-sm">{t("admin.users.noUsersDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t("admin.users.total")}</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-users">{stats?.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t("admin.users.verified")}</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-verified-users">{stats?.verified}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t("admin.users.hotels")}</p>
                <p className="text-2xl font-bold mt-1">{stats?.hotels}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t("admin.users.brokers")}</p>
                <p className="text-2xl font-bold mt-1">{stats?.brokers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{t("admin.users.agents")}</p>
                <p className="text-2xl font-bold mt-1">{stats?.agents}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.businessName")}</TableHead>
                    <TableHead>{t("admin.users.role")}</TableHead>
                    <TableHead>{t("admin.users.verified")}</TableHead>
                    <TableHead>{t("admin.users.joined")}</TableHead>
                    <TableHead className="text-right">{t("admin.users.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => {
                    const initials = user.businessName
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
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
                          <Badge variant={roleColors[user.role] as any}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isVerified}
                              onCheckedChange={(checked) =>
                                verifyMutation.mutate({ userId: user.id, isVerified: checked })
                              }
                              disabled={user.role === "ADMIN"}
                              data-testid={`switch-verify-${user.id}`}
                            />
                            {user.isVerified ? (
                              <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ShieldX className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {user.role === "BROKER" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setGroupBroker(user)}
                                data-testid={`button-view-group-${user.id}`}
                              >
                                <UsersRound className="w-3 h-3 me-1" />
                                {t("group.title")}
                              </Button>
                            )}
                            {user.role !== "ADMIN" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleImpersonate(user.id, user.businessName)}
                                data-testid={`button-impersonate-${user.id}`}
                              >
                                <LogIn className="w-3 h-3 me-1" />
                                {t("admin.users.loginAsUser")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                {t("admin.users.disputeResolution")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("admin.users.disputeDesc")}
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1.5 min-w-[180px]">
                  <Label className="text-xs">{t("admin.users.brokers")}</Label>
                  <Select
                    value={selectedBrokerId}
                    onValueChange={setSelectedBrokerId}
                  >
                    <SelectTrigger data-testid="select-dispute-broker">
                      <SelectValue placeholder={t("admin.users.selectBroker")} />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-[180px]">
                  <Label className="text-xs">{t("admin.users.agents")}</Label>
                  <Select
                    value={selectedAgentId}
                    onValueChange={setSelectedAgentId}
                  >
                    <SelectTrigger data-testid="select-dispute-agent">
                      <SelectValue placeholder={t("admin.users.selectAgent")} />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedBrokerId || !selectedAgentId}
                  onClick={() => setOfferDialogOpen(true)}
                  data-testid="button-view-offers"
                >
                  <Send className="w-3 h-3 me-1" />
                  {t("admin.users.viewOffers")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {groupBroker && (
        <BrokerGroupDialog broker={groupBroker} onClose={() => setGroupBroker(null)} />
      )}

      {offerDialogOpen && selectedBrokerId && selectedAgentId && (
        <OfferHistoryDialog
          brokerId={selectedBrokerId}
          agentId={selectedAgentId}
          brokerName={brokers.find((b: any) => b.id === selectedBrokerId)?.businessName || "Broker"}
          agentName={agents.find((a: any) => a.id === selectedAgentId)?.businessName || "Agent"}
          onClose={() => setOfferDialogOpen(false)}
        />
      )}
    </div>
  );
}

function BrokerGroupDialog({ broker, onClose }: { broker: any; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: members, isLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/broker/${broker.id}/group`],
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="w-5 h-5" />
            {broker.businessName} {t("admin.users.agentGroup")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.users.whitelistedDesc")}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !members || members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("group.noMembers")}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {members.map((agent: any) => {
              const initials = agent.businessName
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-md bg-muted" data-testid={`group-member-${agent.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.businessName}</p>
                    <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{t("auth.agent")}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OfferHistoryDialog({ brokerId, agentId, brokerName, agentName, onClose }: {
  brokerId: string; agentId: string; brokerName: string; agentName: string; onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: offers, isLoading } = useQuery<any[]>({
    queryKey: [`/api/admin/offers/${brokerId}/${agentId}`],
  });

  const statusColors: Record<string, string> = {
    PENDING: "default",
    ACCEPTED: "secondary",
    DECLINED: "outline",
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t("admin.users.offerHistory")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.users.allOffersFrom")} {brokerName} {t("admin.users.to")} {agentName}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !offers || offers.length === 0 ? (
          <div className="text-center py-8">
            <Send className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("admin.users.noOffers")}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {offers.map((offer: any) => (
              <div key={offer.id} className="p-3 rounded-md bg-muted space-y-2" data-testid={`dispute-offer-${offer.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{offer.auction?.roomType || "N/A"}</span>
                    {offer.auction?.hotelName && (
                      <span className="text-xs text-muted-foreground">({offer.auction.hotelName})</span>
                    )}
                  </div>
                  <Badge variant={statusColors[offer.status] as any}>{offer.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("marketplace.rooms")}</span>
                    <span className="font-mono tabular-nums">{offer.roomCount}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("admin.users.wholesale")}</span>
                    <span className="font-mono tabular-nums">${offer.wholesalePrice}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("inventory.offerPrice")}</span>
                    <span className="font-mono tabular-nums font-medium">${offer.pricePerRoom}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("inventory.totalOfferValue")}</span>
                    <span className="font-mono tabular-nums">${offer.totalOfferValue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(offer.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
