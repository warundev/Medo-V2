import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "hospital" | "pharmacy";
  distance?: number;
}

const SRI_LANKA_CENTER = { lat: 6.9271, lon: 79.8612 }; // Colombo
const DEMO_PLACES_SL: Place[] = [
  { id: 'sl-nhsl', name: 'National Hospital of Sri Lanka', address: 'Colombo 10', latitude: 6.9183, longitude: 79.8661, type: 'hospital' },
  { id: 'sl-asiri', name: 'Asiri Medical Hospital', address: 'Colombo 5', latitude: 6.8798, longitude: 79.8778, type: 'hospital' },
  { id: 'sl-lanka', name: 'Lanka Hospitals', address: 'Narahenpita', latitude: 6.8940, longitude: 79.8777, type: 'hospital' },
  { id: 'sl-hemas', name: 'Hemas Hospital - Thalawathugoda', address: 'Thalawathugoda', latitude: 6.8717, longitude: 79.9303, type: 'hospital' },
  { id: 'sl-nawaloka', name: 'Nawaloka Hospital', address: 'Colombo 2', latitude: 6.9220, longitude: 79.8485, type: 'hospital' },
  { id: 'sl-osusala', name: 'Osu Sala - Bambalapitiya', address: 'Bambalapitiya', latitude: 6.8969, longitude: 79.8538, type: 'pharmacy' },
  { id: 'sl-healthguard', name: 'Healthguard Pharmacy - Kollupitiya', address: 'Kollupitiya', latitude: 6.9064, longitude: 79.8532, type: 'pharmacy' },
  { id: 'sl-pharmacy-fort', name: 'City Pharmacy - Fort', address: 'Colombo Fort', latitude: 6.9355, longitude: 79.8439, type: 'pharmacy' },
  { id: 'sl-kandy', name: 'Kandy General Hospital', address: 'Kandy', latitude: 7.2936, longitude: 80.6365, type: 'hospital' },
  { id: 'sl-galle', name: 'Karapitiya Teaching Hospital', address: 'Galle', latitude: 6.0535, longitude: 80.2142, type: 'hospital' }
];

export default function FindCareDemoScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [demoSriLanka, setDemoSriLanka] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (demoSriLanka) {
          // Instant demo without GPS/network dependency
          setPlaces(DEMO_PLACES_SL);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setError("Location permission is required to show nearby care.");
            setLoading(false);
            return;
          }
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(current);
          await fetchNearbyPlaces(current);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to initialize map.");
      } finally {
        setLoading(false);
      }
    })();
  }, [demoSriLanka]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyPlaces = async (userLocation: Location.LocationObject) => {
    try {
      const { latitude, longitude } = userLocation.coords;
      const query = `[out:json];(node(around:3000,${latitude},${longitude})["amenity"="hospital"];node(around:3000,${latitude},${longitude})["amenity"="pharmacy"];);out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { "User-Agent": "MedoDemo/1.0" } });
      if (!res.ok) throw new Error(`Overpass status ${res.status}`);
      const data = await res.json();
      const elements = data.elements || [];
      const mapped: Place[] = elements.map((el: any) => ({
        id: String(el.id),
        name: el.tags?.name || (el.tags?.amenity === "hospital" ? "Hospital" : "Pharmacy"),
        address: [el.tags?.addr_street, el.tags?.addr_housenumber, el.tags?.addr_city].filter(Boolean).join(" ") || "Address unavailable",
        latitude: el.lat,
        longitude: el.lon,
        type: el.tags?.amenity === "hospital" ? "hospital" : "pharmacy",
      }));
      const withDistance = mapped
        .map((p) => ({
          ...p,
          distance: calculateDistance(latitude, longitude, p.latitude, p.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 25);
      setPlaces(withDistance);
    } catch (err) {
      console.warn("Overpass failed, using fallback", err);
      // Fallback demo markers near the user
      if (userLocation) {
        const mock: Place[] = [
          {
            id: "fallback-hospital",
            name: "Demo Hospital",
            address: "Expo Avenue",
            latitude: userLocation.coords.latitude + 0.01,
            longitude: userLocation.coords.longitude + 0.01,
            type: "hospital",
          },
          {
            id: "fallback-pharmacy",
            name: "Demo Pharmacy",
            address: "Leaflet Street",
            latitude: userLocation.coords.latitude - 0.008,
            longitude: userLocation.coords.longitude + 0.012,
            type: "pharmacy",
          },
        ];
        setPlaces(mock);
      }
    }
  };

  const html = useMemo(() => {
    const center = demoSriLanka
      ? SRI_LANKA_CENTER
      : (location ? { lat: location.coords.latitude, lon: location.coords.longitude } : SRI_LANKA_CENTER);

    const markers = (demoSriLanka ? DEMO_PLACES_SL : places)
      .map((p) => ({
        lat: p.latitude,
        lon: p.longitude,
        name: p.name.replace(/`/g, "'"),
        address: p.address.replace(/`/g, "'"),
        type: p.type,
      }))
      .slice(0, 50);

    const markersJson = JSON.stringify(markers);

    return `
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .legend { position: absolute; top: 10px; left: 10px; z-index: 1000; background: rgba(255,255,255,0.9); padding: 6px 10px; border-radius: 8px; font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; font-size: 12px; }
          .badge { display:inline-block; padding:2px 6px; border-radius:6px; color:#fff; margin-right:6px; }
          .hospital { background:#FF5252; }
          .pharmacy { background:#0071E3; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="legend"><span class="badge hospital">Hospital</span><span class="badge pharmacy">Pharmacy</span></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const center = ${JSON.stringify(center)};
          const markers = ${markersJson};
          const map = L.map('map').setView([center.lat, center.lon], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          // Center marker
          L.circleMarker([center.lat, center.lon], { radius: 8, color: '#ffffff', weight: 2, fillColor: '#2ecc71', fillOpacity: 1 }).addTo(map).bindPopup('Center');
          markers.forEach(function(m){
            var color = m.type === 'hospital' ? '#FF5252' : '#0071E3';
            var marker = L.circleMarker([m.lat, m.lon], { radius: 8, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
            var gmaps = 'https://www.google.com/maps?q=' + m.lat + ',' + m.lon;
            marker.bindPopup('<b>' + m.name + '</b><br/>' + m.address + '<br/><a href="' + gmaps + '" target="_blank">Open in Maps</a>');
          });
        </script>
      </body>
      </html>
    `;
  }, [location, places, demoSriLanka]);

  const handleNav = (req: any) => {
    const url: string = req.url;
    if (url.startsWith("https://www.google.com/maps") || url.startsWith("maps:")) {
      Linking.openURL(url);
      return false;
    }
    // Block navigating outside the HTML
    return url.startsWith("about:blank") || url === "";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0071E3" />
        <Text style={styles.loadingText}>Preparing demo map…</Text>
      </View>
    );
  }

  if (!location && !demoSriLanka) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={80} color="#ccc" />
        <Text style={styles.errorText}>{error || "Unable to get your location"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace("/findcare-demo") }>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#0071E3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Care (Demo)</Text>
        <TouchableOpacity style={styles.modeButton} onPress={() => setDemoSriLanka((v) => !v)}>
          <Text style={{ color: '#0071E3', fontWeight: '700' }}>{demoSriLanka ? 'Use GPS' : 'Sri Lanka Demo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={() => (demoSriLanka ? setPlaces(DEMO_PLACES_SL) : (location && fetchNearbyPlaces(location)))}>
          <Ionicons name="refresh" size={22} color="#0071E3" />
        </TouchableOpacity>
      </View>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ width, height: height - 120, backgroundColor: "#f8f9fa" }}
        onShouldStartLoadWithRequest={handleNav}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginLeft: 12 },
  refreshButton: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modeButton: {
    marginLeft: 8,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: "#eef5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 16, fontSize: 18, color: "#666", textAlign: "center" },
  retryButton: { marginTop: 20, backgroundColor: "#0071E3", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
