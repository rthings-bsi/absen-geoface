"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "absensi-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const old = root.getAttribute(attribute);

    if (disableTransitionOnChange) {
      root.style.transition = "none";
    }

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
      root.setAttribute(attribute, systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute(attribute, theme);
    }

    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.style.transition = "";
      }, 0);
    }
  }, [theme, mounted, attribute, disableTransitionOnChange, enableSystem]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey, mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    },
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
