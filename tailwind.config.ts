import type { Config } from "tailwindcss"
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "360px", // Personalizado para telas menores
      sm: "420px", // Personalizado para telas pequenas
      md: "768px", // Personalizado para telas médias
      lg: "992px", // Personalizado para telas grandes
      xl: "1500px", // Personalizado para telas extra grandes
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "primary-blue": "#1D3153",
        "second-blue": "#0056CC",
        "primary-orange": "#FEB100",
        "primary-yellow": "#FED400",
        "primary-gray": "#F0F0F0",
        "sidebar-primary": "#1D3153",
        "sidebar-primary-foreground": "#FFFFFF",
        "custom-muted": "#F0F0F0",
        "custom-muted-foreground": "#6B7280",
        "custom-background": "#FFFFFF",
        "custom-foreground": "#1D3153",
        "donatti-blue": "#0047AB",
        "donatti-yellow": "#f5a406",
        "donatti-gold": "#FFD700",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        blo: ["BLOVERLY"],
        bsf: ["BetterSignatureFont"],
        mon: ["var(--font-montserrat)"],
        neo: ["Neo Sans W1G", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
}
export default config
