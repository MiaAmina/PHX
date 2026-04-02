import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";
import { Building2, MapPin, BedDouble, BadgeCheck, Footprints } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface HotelDetailCardProps {
  hotelId: string;
  open: boolean;
  onClose: () => void;
  listing?: any;
}

export function HotelDetailCard({ hotelId, open, onClose, listing }: HotelDetailCardProps) {
  const { t } = useTranslation();

  const { data: hotel, isLoading } = useQuery<any>({
    queryKey: ["/api/hotels", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/${hotelId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load hotel");
      return res.json();
    },
    enabled: open && !!hotelId,
  });

  const hasLocation = hotel?.latitude && hotel?.longitude;
  const lat = parseFloat(hotel?.latitude || "0");
  const lng = parseFloat(hotel?.longitude || "0");

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div>
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : hotel ? (
            <>
              {hotel.imageUrl ? (
                <div className="relative w-full h-48 bg-muted">
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.businessName}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    data-testid="img-hotel-detail"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl" data-testid="text-hotel-detail-name">
                      {hotel.businessName}
                    </DialogTitle>
                    {hotel.isVerified && (
                      <BadgeCheck className="w-5 h-5 !text-gold shrink-0" data-testid="icon-hotel-verified" />
                    )}
                  </div>
                  {hotel.distanceFromHaram && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <Footprints className="w-4 h-4" />
                      <span data-testid="text-hotel-distance">{hotel.distanceFromHaram}m {t("hotelDetail.fromHaram")}</span>
                    </div>
                  )}
                </div>

                {listing && (
                  <div className="rounded-md bg-muted p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hotelDetail.roomType")}</span>
                      <span className="font-medium">{listing.roomType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hotelDetail.pricePerRoom")}</span>
                      <span className="font-mono font-semibold">${listing.pricePerRoom}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hotelDetail.available")}</span>
                      <span>{listing.availableQuantity} {t("marketplace.rooms")}</span>
                    </div>
                  </div>
                )}

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1" data-testid="tab-hotel-info">
                      {t("hotelDetail.info")}
                    </TabsTrigger>
                    <TabsTrigger value="location" className="flex-1" data-testid="tab-hotel-location" disabled={!hasLocation}>
                      {t("hotelDetail.locationTab")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="mt-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{hotel.businessName}</span>
                      </div>
                      {hotel.distanceFromHaram && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{hotel.distanceFromHaram}m {t("hotelDetail.walkingDistance")}</span>
                        </div>
                      )}
                      {hotel.isVerified && (
                        <Badge variant="secondary" className="mt-2" data-testid="badge-hotel-verified">
                          <BadgeCheck className="w-3 h-3 me-1" />
                          {t("hotelDetail.verified")}
                        </Badge>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="location" className="mt-3">
                    {hasLocation ? (
                      <div className="rounded-lg overflow-hidden border h-[250px]" data-testid="map-hotel-location">
                        <MapContainer
                          center={[lat, lng]}
                          zoom={16}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[lat, lng]}>
                            <Popup>{hotel.businessName}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t("hotelDetail.noLocation")}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
