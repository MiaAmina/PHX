import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Building2, MapPin, Image, Save, Loader2, ExternalLink } from "lucide-react";

export default function HotelProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [distanceFromHaram, setDistanceFromHaram] = useState("");

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/hotel/profile"],
  });

  useEffect(() => {
    if (profile) {
      setImageUrl(profile.imageUrl || "");
      setLatitude(profile.latitude || "");
      setLongitude(profile.longitude || "");
      setDistanceFromHaram(profile.distanceFromHaram?.toString() || "");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/hotel/profile", {
        imageUrl: imageUrl || null,
        latitude: latitude || null,
        longitude: longitude || null,
        distanceFromHaram: distanceFromHaram || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("hotelProfile.saved") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-hotel-profile-title">
          {t("hotelProfile.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("hotelProfile.subtitle")}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 !text-gold" />
              <CardTitle className="text-lg">{t("hotelProfile.hotelImage")}</CardTitle>
            </div>
            <CardDescription>{t("hotelProfile.imageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t("hotelProfile.imageUrl")}</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/hotel-photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="input-image-url"
              />
            </div>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                <img
                  src={imageUrl}
                  alt="Hotel preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  data-testid="img-hotel-preview"
                />
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-dashed border-muted-foreground/25 bg-muted/50 flex flex-col items-center justify-center h-48 gap-2" data-testid="img-hotel-placeholder">
                <Image className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/50">{t("hotelProfile.addImageHint")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 !text-gold" />
              <CardTitle className="text-lg">{t("hotelProfile.location")}</CardTitle>
            </div>
            <CardDescription>{t("hotelProfile.locationDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">{t("hotelProfile.latitude")}</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="21.4225"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  data-testid="input-latitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">{t("hotelProfile.longitude")}</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="39.8262"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  data-testid="input-longitude"
                />
              </div>
            </div>
            {latitude && longitude && (
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-view-on-maps"
              >
                <ExternalLink className="w-3 h-3" />
                {t("hotelProfile.viewOnMaps")}
              </a>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 !text-gold" />
              <CardTitle className="text-lg">{t("hotelProfile.distanceSection")}</CardTitle>
            </div>
            <CardDescription>{t("hotelProfile.distanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="distanceFromHaram">{t("hotelProfile.distanceFromHaram")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="distanceFromHaram"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={distanceFromHaram}
                  onChange={(e) => setDistanceFromHaram(e.target.value)}
                  data-testid="input-distance-from-haram"
                />
                <span className="text-sm text-muted-foreground shrink-0">{t("hotelProfile.meters")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-gold text-gold-foreground border-gold gold-glow"
          disabled={mutation.isPending}
          data-testid="button-save-profile"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin me-2" />
          ) : (
            <Save className="w-4 h-4 me-2" />
          )}
          {t("hotelProfile.saveProfile")}
        </Button>
      </form>
    </div>
  );
}
