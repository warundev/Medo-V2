import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (hasNavigated.current) return;
      const target = user ? "/home" : "/auth";
      const timer = setTimeout(() => {
        hasNavigated.current = true;
        router.replace(target);
      }, 1500);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Use the container style for centering
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0071E3", "#2997FF"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.25)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}>
          <Animated.Image
            source={require("../assets/images/main-logo.png")}
            style={{ width: 100, height: 100, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Medo</Text>
        <Text style={styles.subName}>Your Smart Medicine Minder</Text>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    
  },
  appName: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8, 
    letterSpacing: 1,
  },
  subName: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    letterSpacing: 0.5,
    opacity: 0.85,
    textAlign: "center",
  },
  loaderContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
});
