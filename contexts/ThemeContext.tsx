import React, { createContext, useContext, useEffect, useState } from "react";
import { getSavedTheme, saveTheme, getColors } from "../utils/theme";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeType;
  colors: ReturnType<typeof getColors>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await getSavedTheme();
      setIsDarkMode(saved === "dark");
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = isDarkMode ? "light" : "dark";
      await saveTheme(newTheme);
      setIsDarkMode(newTheme === "dark");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const theme: ThemeType = isDarkMode ? "dark" : "light";
  const colors = getColors(theme);

  if (!isLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
