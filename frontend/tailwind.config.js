/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary":                "#154212",
        "primary-container":      "#2d5a27",
        "primary-fixed":          "#bcf0ae",
        "primary-fixed-dim":      "#a1d494",
        "on-primary":             "#ffffff",
        "on-primary-container":   "#9dd090",
        "secondary":              "#0058bd",
        "secondary-container":    "#1470e8",
        "on-secondary":           "#ffffff",
        "surface":                "#f8f9ff",
        "surface-container":      "#e5eeff",
        "surface-container-low":  "#eff4ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#dce9ff",
        "surface-dim":            "#cbdbf5",
        "on-surface":             "#0b1c30",
        "on-surface-variant":     "#42493e",
        "outline":                "#72796e",
        "outline-variant":        "#c2c9bb",
        "error":                  "#ba1a1a",
        "error-container":        "#ffdad6",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: {
        DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", full: "9999px",
      },
    },
  },
  plugins: [],
};
