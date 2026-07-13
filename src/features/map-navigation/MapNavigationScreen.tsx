import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import {
  GlassCard,
  IconButton,
  PremiumButton,
  PremiumHeader,
  PremiumScreen,
} from "@/src/components/premium";
import {
  createLocationService,
  createOsrmRoutingService,
  type DrivingRoute,
  type RouteCoordinate,
} from "@/src/services";
import { premiumColors, radius, spacing, typography } from "@/src/theme";

type NavigationState = "locating" | "routing" | "ready" | "error";

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const PREMIUM_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b0f13" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7f8996" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f13" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#20262e" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0d1116" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#222831" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#11161c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#323944" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#080b0f" }] },
];

export function MapNavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; name?: string }>();
  const locationService = useMemo(() => createLocationService(), []);
  const routingService = useMemo(() => createOsrmRoutingService(), []);
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<NavigationState>("locating");
  const [message, setMessage] = useState("Getting your current location…");
  const [origin, setOrigin] = useState<RouteCoordinate | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const destination = useMemo(
    () => parseDestination(params.lat, params.lng),
    [params.lat, params.lng],
  );
  const destinationName = params.name?.trim() || "Destination";

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      setOrigin(null);
      setRoute(null);

      if (!destination) {
        setState("error");
        setMessage("This destination does not have valid map coordinates.");
        return;
      }

      setState("locating");
      setMessage("Getting your current location…");
      const permission = await locationService.requestForegroundPermission();
      if (!active) return;
      if (!permission.ok || permission.value.state !== "granted") {
        setState("error");
        setMessage("Foreground location permission is required to build a route.");
        return;
      }

      const currentLocation = await locationService.getCurrentLocation();
      if (!active) return;
      if (!currentLocation.ok) {
        setState("error");
        setMessage(currentLocation.error.message);
        return;
      }

      const currentCoordinate = {
        latitude: currentLocation.value.latitude,
        longitude: currentLocation.value.longitude,
      };
      setOrigin(currentCoordinate);
      setState("routing");
      setMessage("Building the fastest available driving route…");

      const result = await routingService.getDrivingRoute(currentCoordinate, destination);
      if (!active) return;
      if (!result.ok) {
        setState("error");
        setMessage(result.message);
        return;
      }

      setRoute(result.route);
      setState("ready");
      setMessage("Route ready");
    }

    void loadRoute();
    return () => {
      active = false;
    };
  }, [destination, locationService, refreshKey, routingService]);

  useEffect(() => {
    if (!mapReady || !route) return;

    mapRef.current?.fitToCoordinates([...route.coordinates], {
      edgePadding: { top: 72, right: 48, bottom: 176, left: 48 },
      animated: true,
    });
  }, [mapReady, route]);

  const initialRegion = destination ? createRegion(destination) : DEFAULT_REGION;

  return (
    <PremiumScreen
      scroll={false}
      contentContainerStyle={styles.screenContent}
    >
      <PremiumHeader
        eyebrow="In-app navigation"
        title="Directions"
        subtitle={destinationName}
        leading={
          <IconButton
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            icon={
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                size={22}
                tintColor={premiumColors.textPrimary}
              />
            }
          />
        }
      />

      <GlassCard style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={PREMIUM_MAP_STYLE}
          mapType="standard"
          showsUserLocation={false}
          showsCompass
          toolbarEnabled={false}
          onMapReady={() => setMapReady(true)}
        >
          {route ? (
            <>
              <Polyline
                coordinates={[...route.coordinates]}
                strokeColor="rgba(7, 10, 15, 0.82)"
                strokeWidth={8}
              />
              <Polyline
                coordinates={[...route.coordinates]}
                strokeColor={premiumColors.primary}
                strokeWidth={4}
              />
            </>
          ) : null}
          {origin ? (
            <Marker coordinate={origin} title="Your location" pinColor={premiumColors.success} />
          ) : null}
          {destination ? (
            <Marker coordinate={destination} title={destinationName} pinColor={premiumColors.primary} />
          ) : null}
        </MapView>

        <GlassCard style={styles.routeCard}>
          <View style={styles.routeTopline}>
            <Text style={styles.routeStatus}>{stateLabel(state)}</Text>
            {route ? (
              <Text style={styles.routeDistance}>{formatDistance(route.distanceMeters)}</Text>
            ) : null}
          </View>
          <Text numberOfLines={2} style={styles.destinationName}>{destinationName}</Text>
          <Text style={styles.routeMessage}>
            {route ? `${formatDuration(route.durationSeconds)} estimated driving time` : message}
          </Text>
          {state === "error" ? (
            <PremiumButton title="Try Again" onPress={() => setRefreshKey((key) => key + 1)} />
          ) : null}
        </GlassCard>
      </GlassCard>
    </PremiumScreen>
  );
}

function parseDestination(lat: string | undefined, lng: string | undefined) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (
    !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function createRegion(coordinate: RouteCoordinate): Region {
  return {
    ...coordinate,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };
}

function stateLabel(state: NavigationState) {
  if (state === "locating") return "LOCATING";
  if (state === "routing") return "BUILDING ROUTE";
  if (state === "ready") return "ROUTE READY";
  return "ROUTE UNAVAILABLE";
}

function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  mapCard: {
    flex: 1,
    minHeight: 420,
    padding: 0,
    backgroundColor: "#08090B",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routeCard: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    left: spacing.md,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(7, 10, 15, 0.92)",
  },
  routeTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  routeStatus: {
    ...typography.label,
    flex: 1,
    color: premiumColors.primary,
    letterSpacing: 1,
  },
  routeDistance: {
    ...typography.button,
    color: premiumColors.textPrimary,
  },
  destinationName: {
    ...typography.subtitle,
    color: premiumColors.textPrimary,
  },
  routeMessage: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
});
