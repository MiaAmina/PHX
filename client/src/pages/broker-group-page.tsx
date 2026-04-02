import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import {
  UserPlus,
  UserMinus,
  Search,
  Users,
  BadgeCheck,
  Mail,
  Building2,
  Loader2,
} from "lucide-react";

export default function BrokerGroupPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: allAgents, isLoading: loadingAgents } = useQuery<any[]>({
    queryKey: ["/api/broker/agents"],
  });

  const { data: myGroup, isLoading: loadingGroup } = useQuery<any[]>({
    queryKey: ["/api/broker/group"],
  });

  const addMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await apiRequest("POST", `/api/broker/group/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broker/group"] });
      toast({ title: t("group.addedToGroup") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await apiRequest("DELETE", `/api/broker/group/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broker/group"] });
      toast({ title: t("group.removedFromGroup") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const filteredAgents = (allAgents || []).filter((a: any) =>
    a.businessName.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const groupAgents = filteredAgents.filter((a: any) => a.inGroup);
  const directoryAgents = filteredAgents.filter((a: any) => !a.inGroup);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-group-title">{t("group.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("group.subtitle")}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("group.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-agents"
          />
        </div>
        <Badge variant="secondary" data-testid="badge-group-count">
          <Users className="w-3 h-3 me-1" />
          {myGroup?.length || 0} {t("group.inGroup")}
        </Badge>
      </div>

      <Tabs defaultValue="group">
        <TabsList>
          <TabsTrigger value="group" data-testid="tab-my-group">{t("group.title")} ({groupAgents.length})</TabsTrigger>
          <TabsTrigger value="directory" data-testid="tab-directory">{t("group.agentDirectory")} ({directoryAgents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="mt-4">
          {loadingGroup ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : groupAgents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">{t("group.noMembers")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t("group.noMembersDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groupAgents.map((agent: any) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  inGroup
                  onRemove={() => removeMutation.mutate(agent.id)}
                  isPending={removeMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="directory" className="mt-4">
          {loadingAgents ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : directoryAgents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {search ? t("group.noMatchingAgents") : t("group.allAgentsInGroup")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {directoryAgents.map((agent: any) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  inGroup={false}
                  onAdd={() => addMutation.mutate(agent.id)}
                  isPending={addMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AgentCard({
  agent,
  inGroup,
  onAdd,
  onRemove,
  isPending,
}: {
  agent: any;
  inGroup: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const initials = agent.businessName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="glass-card" data-testid={`card-agent-${agent.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{agent.businessName}</p>
              <BadgeCheck className="w-3.5 h-3.5 !text-gold shrink-0" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{agent.email}</span>
            </div>
          </div>
          {inGroup ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              disabled={isPending}
              data-testid={`button-remove-agent-${agent.id}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={onAdd}
              disabled={isPending}
              data-testid={`button-add-agent-${agent.id}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
