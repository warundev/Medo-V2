import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "hospital" | "pharmacy";
  distanceKm?: number;
}

interface RouteSummary {
  distanceKm: number;
  durationMin: number;
  steps: string[];
  coordinates: { latitude: number; longitude: number }[];
}

const SRI_LANKA_REGION: Region = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.8,
  longitudeDelta: 2.8,
};

const COLOMBO_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const SRI_LANKA_DEMO_CARE: Place[] = [
  {
    id: "sl-nhsl",
    name: "National Hospital of Sri Lanka",
    address: "Colombo 10",
    latitude: 6.9183,
    longitude: 79.8661,
    type: "hospital",
  },
  {
    id: "sl-asiri",
    name: "Asiri Medical Hospital",
    address: "Colombo 5",
    latitude: 6.8798,
    longitude: 79.8778,
    type: "hospital",
  },
  {
    id: "sl-lanka",
    name: "Lanka Hospitals",
    address: "Narahenpita",
    latitude: 6.894,
    longitude: 79.8777,
    type: "hospital",
  },
  {
    id: "sl-kandy",
    name: "Kandy National Hospital",
    address: "Kandy",
    latitude: 7.2936,
    longitude: 80.6365,
    type: "hospital",
  },
  {
    id: "sl-karapitiya",
    name: "Karapitiya Teaching Hospital",
    address: "Galle",
    latitude: 6.0535,
    longitude: 80.2142,
    type: "hospital",
  },
  {
    id: "sl-osusala",
    name: "Osu Sala",
    address: "Bambalapitiya",
    latitude: 6.8969,
    longitude: 79.8538,
    type: "pharmacy",
  },
  {
    id: "sl-healthguard",
    name: "Healthguard Pharmacy",
    address: "Kollupitiya",
    latitude: 6.9064,
    longitude: 79.8532,
    type: "pharmacy",
  },
];

export default function FindCareScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(SRI_LANKA_REGION);
  const [places, setPlaces] = useState<Place[]>(SRI_LANKA_DEMO_CARE);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [activeType, setActiveType] = useState<"all" | "hospital" | "pharmacy">("all");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const markerColor = useMemo(
    () => ({
      hospital: "#FF5252",
      pharmacy: "#0071E3",
    }),
    []
  );

  const calculateDistanceKm = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const earthRadiusKm = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadiusKm * c;
    },
    []
  );

  const sortByDistance = useCallback(
    (inputPlaces: Place[], latitude: number, longitude: number) => {
      return [...inputPlaces]
        .map((place) => ({
          ...place,
          distanceKm: calculateDistanceKm(latitude, longitude, place.latitude, place.longitude),
        }))
        .sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
    },
    [calculateDistanceKm]
  );

  const fetchNearbyPlaces = useCallback(async (latitude: number, longitude: number) => {
    const query = `[out:json];(node(around:6000,${latitude},${longitude})["amenity"="hospital"];node(around:6000,${latitude},${longitude})["amenity"="pharmacy"];);out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { "User-Agent": "MedoApp/1.0" } });
    if (!response.ok) {
      throw new Error(`Overpass API failed: ${response.status}`);
    }
    const data = await response.json();
    const elements = data?.elements ?? [];
    const mapped: Place[] = elements.slice(0, 40).map((el: any) => ({
      id: String(el.id),
      name:
        el.tags?.name || (el.tags?.amenity === "hospital" ? "Hospital" : "Pharmacy"),
      address:
        [el.tags?.addr_street, el.tags?.addr_housenumber, el.tags?.addr_city]
          .filter(Boolean)
          .join(" ") || "Address unavailable",
      latitude: el.lat,
      longitude: el.lon,
      type: el.tags?.amenity === "hospital" ? "hospital" : "pharmacy",
    }));
    if (mapped.length > 0) {
      setPlaces(sortByDistance(mapped, latitude, longitude));
    }
  }, [sortByDistance]);

  const focusOnPlace = useCallback((place: Place) => {
    const focusRegion: Region = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(focusRegion);
    mapRef.current?.animateToRegion(focusRegion, 500);
  }, []);

  const startNavigation = useCallback(
    async (place: Place) => {
      if (!userLocation) {
        Alert.alert("Location required", "Enable location to calculate a route.");
        return;
      }

      try {
        setRouteLoading(true);
        setSelectedPlace(place);
        const origin = `${userLocation.longitude},${userLocation.latitude}`;
        const destination = `${place.longitude},${place.latitude}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson&steps=true`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`OSRM route failed: ${response.status}`);
        }
        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route) {
          throw new Error("No route found");
        }

        const coordinates = (route.geometry?.coordinates ?? []).map(
          ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon })
        );
        const steps = (route.legs?.[0]?.steps ?? [])
          .map((step: any) => step.maneuver?.instruction)
          .filter(Boolean);

        setRouteSummary({
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
          steps,
          coordinates,
        });

        if (coordinates.length > 0) {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 80, right: 60, bottom: 260, left: 60 },
            animated: true,
          });
        }
      } catch (error) {
        console.warn("Route fetch failed", error);
        Alert.alert("Route unavailable", "Unable to build in-app navigation route.");
      } finally {
        setRouteLoading(false);
      }
    },
    [userLocation]
  );

  const clearRoute = useCallback(() => {
    setRouteSummary(null);
    setSelectedPlace(null);
  }, []);

  const locateAndLoadCare = useCallback(async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setRegion(COLOMBO_REGION);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
      setUserLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setRegion(nextRegion);
      await fetchNearbyPlaces(current.coords.latitude, current.coords.longitude);
    } catch (error) {
      console.warn("FindCare map load failed", error);
      Alert.alert("Map Notice", "Using Sri Lanka map view with available care locations.");
      setRegion(COLOMBO_REGION);
      setPlaces(sortByDistance(SRI_LANKA_DEMO_CARE, COLOMBO_REGION.latitude, COLOMBO_REGION.longitude));
    } finally {
      setLocating(false);
    }
  }, [fetchNearbyPlaces, sortByDistance]);

  useEffect(() => {
    (async () => {
      await locateAndLoadCare();
      setLoading(false);
    })();
  }, [locateAndLoadCare]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0071E3" />
        <Text style={styles.loadingText}>Loading Find Care map…</Text>
      </View>
    );
  }

  const visiblePlaces =
    activeType === "all" ? places : places.filter((place) => place.type === activeType);
  const nearestPlace = visiblePlaces[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Find Care</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.locateButton}
            onPress={locateAndLoadCare}
            disabled={locating}
          >
            <Ionicons
              name={locating ? "hourglass-outline" : "locate-outline"}
              size={18}
              color="#0071E3"
            />
            <Text style={styles.locateText}>{locating ? "Locating..." : "My Location"}</Text>
          </TouchableOpacity>
          {nearestPlace ? (
            <TouchableOpacity
              style={styles.navigateNearestButton}
              onPress={() => startNavigation(nearestPlace)}
            >
              <Ionicons name="navigate" size={15} color="#fff" />
              <Text style={styles.navigateNearestText}>Route</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "All", value: "all" as const },
          { label: "Hospitals", value: "hospital" as const },
          { label: "Pharmacies", value: "pharmacy" as const },
        ].map((item) => {
          const isActive = activeType === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => setActiveType(item.value)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={styles.map}
        initialRegion={SRI_LANKA_REGION}
        region={region}
        showsUserLocation
        showsMyLocationButton={Platform.OS === "android"}
      >
        {routeSummary?.coordinates?.length ? (
          <Polyline
            coordinates={routeSummary.coordinates}
            strokeColor="#0071E3"
            strokeWidth={5}
          />
        ) : null}
        {visiblePlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.name}
            description={
              place.distanceKm ? `${place.address} • ${place.distanceKm.toFixed(1)} km` : place.address
            }
            pinColor={markerColor[place.type]}
            onPress={() => focusOnPlace(place)}
          />
        ))}
      </MapView>

      <View style={styles.bottomPanel}>
        <Text style={styles.bottomTitle}>Nearby Care Centers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
          {visiblePlaces.slice(0, 8).map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.card}
              onPress={() => focusOnPlace(place)}
              activeOpacity={0.9}
            >
              <View style={styles.cardTopRow}>
                <Ionicons
                  name={place.type === "hospital" ? "medical" : "medkit"}
                  size={16}
                  color={markerColor[place.type]}
                />
                <Text style={styles.cardType}>
                  {place.type === "hospital" ? "Hospital" : "Pharmacy"}
                </Text>
              </View>
              <Text style={styles.cardName} numberOfLines={2}>
                {place.name}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={2}>
                {place.address}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDistance}>
                  {place.distanceKm ? `${place.distanceKm.toFixed(1)} km` : "Distance N/A"}
                </Text>
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => startNavigation(place)}
                >
                  <Ionicons name="navigate" size={14} color="#fff" />
                  <Text style={styles.navigateButtonText}>Route</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {routeSummary ? (
          <View style={styles.routePanel}>
            <View style={styles.routeHeader}>
              <View>
                <Text style={styles.routeTitle}>
                  {selectedPlace?.name || "Route"}
                </Text>
                <Text style={styles.routeMeta}>
                  {routeSummary.distanceKm.toFixed(1)} km • {Math.round(routeSummary.durationMin)} min
                </Text>
              </View>
              <TouchableOpacity style={styles.clearRouteButton} onPress={clearRoute}>
                <Text style={styles.clearRouteText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
              {routeSummary.steps.length === 0 ? (
                <Text style={styles.stepText}>No turn-by-turn steps available.</Text>
              ) : (
                routeSummary.steps.slice(0, 8).map((step, index) => (
                  <Text key={`${step}-${index}`} style={styles.stepText}>
                    {index + 1}. {step}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        ) : null}

        {routeLoading ? (
          <View style={styles.routeLoading}> 
            <ActivityIndicator size="small" color="#0071E3" />
            <Text style={styles.routeLoadingText}>Building route…</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 58 : 38,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ededed",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f4f7",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#eef5ff",
  },
  locateText: { color: "#0071E3", fontWeight: "600", fontSize: 13 },
  navigateNearestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#0071E3",
  },
  navigateNearestText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    backgroundColor: "#fff",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f2f4f7",
  },
  filterButtonActive: {
    backgroundColor: "#0071E3",
  },
  filterText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  map: { flex: 1 },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 22 : 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
  },
  bottomTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  routePanel: {
    marginTop: 12,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f7f9fc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  routeMeta: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },
  clearRouteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
  },
  clearRouteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  stepsList: {
    maxHeight: 120,
  },
  stepText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 16,
  },
  routeLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginHorizontal: 12,
  },
  routeLoadingText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
  },
  cardsRow: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 220,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececec",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  cardType: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardAddress: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDistance: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0071E3",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  navigateButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});
