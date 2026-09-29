import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "320px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
      "5xl": "3840px",
    },
    extend: {
      maxWidth: {
        "container-xl": "1280px",
        "container-2xl": "1440px",
        "container-3xl": "1760px",
        "container-4xl": "2200px",
        "container-5xl": "3200px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          950: "#080A0E", // Deep ink black
          900: "#0D111A", // Surface layer 1
          850: "#121724", // Surface layer 2 (panels)
          800: "#182030", // Hairline borders & subtle hover
          700: "#222C40",
          600: "#313E56",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#121724",
          900: "#0D111A",
          950: "#080A0E",
        },
        brand: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b", // Warm amber primary
          600: "#d97706",
          700: "#b45309",
        },
        pitch: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981", // Pitch emerald primary
          600: "#059669",
          700: "#047857",
        },
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        editorial: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
