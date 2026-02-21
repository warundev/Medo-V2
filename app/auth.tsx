import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebase";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError("Email and password are required.");
        return;
      }

      if (mode === "signup") {
        if (!displayName.trim()) {
          setError("Please enter your name.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (credential.user) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
          await setDoc(doc(db, "users", credential.user.uid), {
            uid: credential.user.uid,
            name: displayName.trim(),
            email: credential.user.email,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      router.replace("/home");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0071E3", "#2997FF"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Medo</Text>
          <Text style={styles.subtitle}>Your Smart Medicine Minder</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, mode === "login" && styles.modeButtonActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === "signup" && styles.modeButtonActive]}
              onPress={() => setMode("signup")}
            >
              <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {mode === "signup" ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="log-in" size={18} color="#fff" />
            <Text style={styles.submitText}>{loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#0071E3",
  },
  modeText: {
    fontWeight: "600",
    color: "#475569",
  },
  modeTextActive: {
    color: "#fff",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: "#475569",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: "#0f172a",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0071E3",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  submitText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    flex: 1,
  },
});
