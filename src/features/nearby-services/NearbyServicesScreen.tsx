import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  GlassCard,
  IconButton,
  PremiumButton,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
} from "@/src/components/premium";
import { useAuth } from "@/src/providers";
import {
  NEARBY_SERVICE_CATEGORIES,
  createGoogleMapsFallbackSearchUrl,
  createGoogleMapsPlaceUrl,
  createLocationService,
  createNearbyServicesService,
  getNearbyCategory,
  type NearbyCoordinate,
  type NearbyPlace,
  type NearbySearchErrorCode,
  type NearbyServiceCategory,
} from "@/src/services";
import { premiumColors, radius, spacing, typography } from "@/src/theme";

type ScreenState =
  | "idle"
  | "locating"
  | "searching"
  | "results"
  | "empty"
  | "permission"
  | "error"
  | "auth_required";

export function NearbyServicesScreen() {
  const router = useRouter();
  const { loadingAuth, session } = useAuth();
  const params = useLocalSearchParams<{
    category?: string;
    recommended?: string;
  }>();
  const initialCategory = isCategory(params.category)
    ? params.category
    : "motorcycle_repair";
  const locationService = useMemo(() => createLocationService(), []);
  const nearbyService = useMemo(() => createNearbyServicesService(), []);
  const [category, setCategory] =
    useState<NearbyServiceCategory>(initialCategory);
  const [state, setState] = useState<ScreenState>("idle");
  const [places, setPlaces] = useState<readonly NearbyPlace[]>([]);
  const [location, setLocation] = useState<NearbyCoordinate | null>(null);
  const [error, setError] = useState<{
    code: NearbySearchErrorCode | "location";
    message: string;
  } | null>(null);
  const selected = getNearbyCategory(category);

  function explainAndSearch() {
    if (loadingAuth) return;

    if (!session) {
      setState("auth_required");
      setError({
        code: "auth_required",
        message: "Sign in to search for nearby services.",
      });
      return;
    }
    Alert.alert(
      "Find nearby services",
      "Use your location to find nearby fuel and motorcycle services.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Use current location",
          onPress: () => {
            void locateAndSearch();
          },
        },
      ],
    );
  }

  async function locateAndSearch() {
    if (loadingAuth) return;

    setError(null);
    setState("locating");
    const permission = await locationService.requestForegroundPermission();
    if (!permission.ok || permission.value.state !== "granted") {
      setState("permission");
      const message =
        permission.ok && permission.value.state === "unavailable"
          ? "Turn on device location services, then try again."
          : "Foreground location permission is required. AxionRide does not request background location.";
      setError({ code: "location", message });
      return;
    }
    const current = await locationService.getCurrentLocation();
    if (!current.ok) {
      setState("error");
      setError({ code: "location", message: current.error.message });
      return;
    }
    const coordinate = {
      latitude: current.value.latitude,
      longitude: current.value.longitude,
    };
    setLocation(coordinate);
    await runSearch(coordinate, category);
  }

  async function runSearch(
    coordinate: NearbyCoordinate,
    nextCategory: NearbyServiceCategory,
  ) {
    if (loadingAuth) return;

    if (!session) {
      setState("auth_required");
      setError({
        code: "auth_required",
        message: "Sign in to search for nearby services.",
      });
      return;
    }

    setState("searching");
    setError(null);
    setPlaces([]);
    const result = await nearbyService.search({
      ...coordinate,
      category: nextCategory,
      radiusMeters: 5000,
    });
    if (!result.ok) {
      setState(result.code === "auth_required" ? "auth_required" : "error");
      setError({ code: result.code, message: result.message });
      return;
    }
    setPlaces(result.places);
    setState(result.places.length ? "results" : "empty");
  }

  function selectCategory(nextCategory: NearbyServiceCategory) {
    setCategory(nextCategory);
    if (location) void runSearch(location, nextCategory);
  }

  function retry() {
    if (location) void runSearch(location, category);
    else explainAndSearch();
  }

  return (
    <PremiumScreen showsVerticalScrollIndicator={false}>
      <PremiumHeader
        eyebrow="Rider assistance"
        title="Nearby Services"
        subtitle="Real places near your current location"
        leading={
          <IconButton
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            icon={
              <SymbolView
                name={{
                  ios: "chevron.left",
                  android: "arrow_back",
                  web: "arrow_back",
                }}
                size={22}
                tintColor={premiumColors.textPrimary}
              />
            }
          />
        }
      />

      {params.recommended === "maintenance" ? (
        <View style={styles.recommendation}>
          <SymbolView
            name={{
              ios: "wrench.and.screwdriver.fill",
              android: "build",
              web: "build",
            }}
            size={18}
            tintColor={premiumColors.primary}
          />
          <Text style={styles.recommendationText}>
            Recommended based on your maintenance task.
          </Text>
        </View>
      ) : null}

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionLabel}>SERVICE CATEGORY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {NEARBY_SERVICE_CATEGORIES.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item.id }}
              onPress={() => selectCategory(item.id)}
              style={({ pressed }) => [
                styles.category,
                category === item.id && styles.categorySelected,
                pressed && styles.pressed,
              ]}
            >
              <CategoryIcon category={item.id} active={category === item.id} />
              <Text
                style={[
                  styles.categoryText,
                  category === item.id && styles.categoryTextSelected,
                ]}
              >
                {item.shortLabel}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {state === "idle" ? (
        <StateCard
          icon="location"
          title={`Find nearby ${selected.label.toLowerCase()}`}
          message="Your location is used only for this search and is not saved to history."
        >
          <PremiumButton
            title="Find Nearby Services"
            onPress={explainAndSearch}
          />
        </StateCard>
      ) : null}
      {state === "auth_required" ? (
        <StateCard
          icon="warning"
          title="Sign in required"
          message="Nearby Services requires an authenticated AxionRide account. Sign in to search for real nearby places."
        >
          <PremiumButton
            title="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </StateCard>
      ) : null}
      {state === "locating" ? (
        <StateCard
          icon="location"
          title="Locating rider"
          message="Getting your current foreground location…"
          busy
        />
      ) : null}
      {state === "searching" ? (
        <StateCard
          icon="search"
          title={`Searching ${selected.label.toLowerCase()}`}
          message="Checking real nearby provider results…"
          busy
        />
      ) : null}
      {state === "permission" ? (
        <StateCard
          icon="location"
          title="Location permission required"
          message={error?.message ?? ""}
        >
          <PremiumButton title="Try Again" onPress={explainAndSearch} />
          <PremiumButton
            title="Open System Settings"
            variant="secondary"
            onPress={() => {
              void Linking.openSettings();
            }}
          />
        </StateCard>
      ) : null}
      {state === "error" ? (
        <StateCard
          icon="warning"
          title={errorTitle(error?.code)}
          message={error?.message ?? "Nearby services are unavailable."}
        >
          <PremiumButton title="Retry" onPress={retry} />
          <PremiumButton
            title="Search in Google Maps"
            variant="secondary"
            onPress={() => {
              void Linking.openURL(
                createGoogleMapsFallbackSearchUrl(
                  category,
                  location ?? undefined,
                ),
              );
            }}
          />
        </StateCard>
      ) : null}
      {state === "empty" ? (
        <StateCard
          icon="search"
          title="No results nearby"
          message={`No verified ${selected.label.toLowerCase()} were returned within 5 km.`}
        >
          <PremiumButton title="Try Again" onPress={retry} />
          <PremiumButton
            title="Search in Google Maps"
            variant="secondary"
            onPress={() => {
              void Linking.openURL(
                createGoogleMapsFallbackSearchUrl(
                  category,
                  location ?? undefined,
                ),
              );
            }}
          />
        </StateCard>
      ) : null}

      {state === "results" ? (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.resultsTitle}>{selected.label}</Text>
              <Text style={styles.resultsSubtitle}>
                {places.length} real result{places.length === 1 ? "" : "s"}{" "}
                within 5 km
              </Text>
            </View>
            <PremiumButton title="Refresh" variant="ghost" onPress={retry} />
          </View>
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onDirections={() => router.push(createMapNavigationHref(place))}
            />
          ))}
          <Text style={styles.verifyNotice}>
            Verify services, hours, and availability with the business before
            visiting.
          </Text>
        </View>
      ) : null}
    </PremiumScreen>
  );
}

function PlaceCard({ place, onDirections }: { readonly place: NearbyPlace; readonly onDirections: () => void }) {
  return (
    <GlassCard style={styles.placeCard}>
      <View style={styles.placeTop}>
        <View style={styles.placeCopy}>
          <Text numberOfLines={2} style={styles.placeName}>
            {place.name}
          </Text>
          <Text numberOfLines={2} style={styles.placeAddress}>
            {place.address}
          </Text>
        </View>
        <Text style={styles.distance}>
          {formatDistance(place.distanceMeters)}
        </Text>
      </View>
      <View style={styles.meta}>
        <StatusBadge
          label={place.hoursStatus === "available" ? "Hours available" : "Hours unknown"}
          tone="neutral"
          dot
        />
        {place.rating !== null ? (
          <Text style={styles.rating}>
            ★ {place.rating.toFixed(1)}
            {place.reviewCount !== null ? ` (${place.reviewCount})` : ""}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <PremiumButton
          title="Directions"
          onPress={onDirections}
        />
        <PremiumButton
          title="Open in Maps"
          variant="secondary"
          onPress={() => {
            void Linking.openURL(createGoogleMapsPlaceUrl(place));
          }}
        />
        {place.phoneNumber ? (
          <PremiumButton
            title="Call"
            variant="ghost"
            onPress={() => {
              void Linking.openURL(`tel:${place.phoneNumber}`);
            }}
          />
        ) : null}
      </View>
    </GlassCard>
  );
}

function StateCard({
  icon,
  title,
  message,
  busy = false,
  children,
}: {
  readonly icon: "location" | "search" | "warning";
  readonly title: string;
  readonly message: string;
  readonly busy?: boolean;
  readonly children?: React.ReactNode;
}) {
  const symbol =
    icon === "location"
      ? ({
          ios: "location.fill",
          android: "my_location",
          web: "my_location",
        } as const)
      : icon === "search"
        ? ({
            ios: "magnifyingglass",
            android: "search",
            web: "search",
          } as const)
        : ({
            ios: "exclamationmark.triangle.fill",
            android: "warning",
            web: "warning",
          } as const);
  return (
    <GlassCard style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <SymbolView name={symbol} size={28} tintColor={premiumColors.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {busy ? (
        <Text style={styles.busy}>PLEASE WAIT</Text>
      ) : children ? (
        <View style={styles.stateActions}>{children}</View>
      ) : null}
    </GlassCard>
  );
}

function CategoryIcon({
  category,
  active,
}: {
  readonly category: NearbyServiceCategory;
  readonly active: boolean;
}) {
  const names = {
    fuel: "local_gas_station",
    motorcycle_repair: "build",
    oil_change: "water_drop",
    tires: "tire_repair",
    battery_electrical: "battery_charging_full",
    dealer: "storefront",
  } as const;
  return (
    <SymbolView
      name={{
        ios:
          category === "fuel"
            ? "fuelpump.fill"
            : category === "dealer"
              ? "storefront.fill"
              : "wrench.and.screwdriver.fill",
        android: names[category],
        web: names[category],
      }}
      size={20}
      tintColor={active ? premiumColors.primary : premiumColors.textSecondary}
    />
  );
}

function errorTitle(code: NearbySearchErrorCode | "location" | undefined) {
  if (code === "rate_limited") return "Search limit reached";
  if (code === "network_error") return "No network connection";
  if (code === "auth_required") return "Sign in required";
  if (code === "timeout") return "Search timed out";
  if (code === "invalid_response") return "No provider results";
  if (code === "location") return "Location unavailable";
  return "Nearby provider unavailable";
}

function isCategory(value: string | undefined): value is NearbyServiceCategory {
  return NEARBY_SERVICE_CATEGORIES.some((item) => item.id === value);
}

function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function createMapNavigationHref(place: NearbyPlace) {
  const params = new URLSearchParams({
    lat: String(place.location.latitude),
    lng: String(place.location.longitude),
    name: place.name,
  });
  return `/map-navigation?${params.toString()}` as Href;
}

const styles = StyleSheet.create({
  recommendation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: premiumColors.borderOrange,
    borderRadius: radius.lg,
    backgroundColor: premiumColors.primaryMuted,
  },
  recommendationText: {
    ...typography.caption,
    flex: 1,
    color: premiumColors.textPrimary,
  },
  categoriesSection: { gap: spacing.md },
  sectionLabel: {
    ...typography.label,
    color: premiumColors.textSecondary,
    letterSpacing: 1,
  },
  categories: { gap: spacing.sm, paddingRight: spacing.xl },
  category: {
    minWidth: 92,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: premiumColors.border,
    borderRadius: radius.lg,
    backgroundColor: premiumColors.surfaceGlass,
  },
  categorySelected: {
    borderColor: premiumColors.borderOrange,
    backgroundColor: premiumColors.primaryMuted,
  },
  categoryText: { ...typography.caption, color: premiumColors.textSecondary },
  categoryTextSelected: { color: premiumColors.textPrimary },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  stateCard: { alignItems: "center", padding: spacing.xl, gap: spacing.md },
  stateIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: premiumColors.primaryMuted,
  },
  stateTitle: {
    ...typography.subheading,
    color: premiumColors.textPrimary,
    textAlign: "center",
  },
  stateMessage: {
    ...typography.body,
    color: premiumColors.textSecondary,
    textAlign: "center",
  },
  stateActions: { width: "100%", gap: spacing.md, marginTop: spacing.sm },
  busy: {
    ...typography.label,
    color: premiumColors.primary,
    letterSpacing: 1.2,
  },
  results: { gap: spacing.md },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsTitle: { ...typography.subtitle, color: premiumColors.textPrimary },
  resultsSubtitle: {
    ...typography.caption,
    color: premiumColors.textSecondary,
  },
  placeCard: { padding: spacing.lg, gap: spacing.md },
  placeTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  placeCopy: { flex: 1 },
  placeName: { ...typography.subtitle, color: premiumColors.textPrimary },
  placeAddress: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: premiumColors.textSecondary,
  },
  distance: { ...typography.button, color: premiumColors.primary },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rating: { ...typography.caption, color: premiumColors.warning },
  actions: { gap: spacing.sm },
  verifyNotice: {
    ...typography.caption,
    color: premiumColors.textSecondary,
    textAlign: "center",
    padding: spacing.md,
  },
});
