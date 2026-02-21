import AsyncStorage from "@react-native-async-storage/async-storage";

export const LIGHT_COLORS = {
  primary: "#0071E3",
  primaryLight: "#2997FF",
  background: "#f8f9fa",
  surface: "white",
  text: "#333",
  secondaryText: "#666",
  border: "#e0e0e0",
  placeholder: "#999",
  error: "#F44336",
  success: "#34C759",
};

export const DARK_COLORS = {
  primary: "#0071E3",
  primaryLight: "#2997FF",
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  secondaryText: "#B3B3B3",
  border: "#333333",
  placeholder: "#666666",
  error: "#FF6B6B",
  success: "#34C759",
};

const THEME_STORAGE_KEY = "app_theme_mode";

export async function getSavedTheme(): Promise<"light" | "dark"> {
  try {
    const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Error reading theme preference:", error);
    return "light";
  }
}

export async function saveTheme(theme: "light" | "dark"): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Error saving theme preference:", error);
  }
}

export function getColors(theme: "light" | "dark") {
  return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}
