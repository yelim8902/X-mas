import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-sans-serif", "system-ui", "Apple SD Gothic Neo", "Segoe UI", "Roboto", "Helvetica", "Arial"]
      },
      colors: {
        skyPastel: {
          50: "#F6FBFF",
          100: "#EAF6FF",
          200: "#D6EEFF",
          300: "#BFE3FF",
          400: "#97D2FF",
          500: "#6ABDF6",
          600: "#3CA2EA",
          700: "#1D84CC",
          800: "#186CA6",
          900: "#155B89"
        },
        christmas: {
          red: "#E84C4C",
          green: "#2FB171"
        }
      },
      boxShadow: {
        clay: "0 18px 30px rgba(25, 50, 80, 0.18), 0 6px 12px rgba(25, 50, 80, 0.10)",
        clayInset:
          "inset 0 2px 0 rgba(255, 255, 255, 0.55), inset 0 -10px 18px rgba(0, 0, 0, 0.10)",
        clayPressed:
          "inset 0 10px 18px rgba(0, 0, 0, 0.14), inset 0 -2px 0 rgba(255, 255, 255, 0.35), 0 10px 18px rgba(25, 50, 80, 0.12)"
      },
      borderRadius: {
        clay: "28px"
      }
    }
  },
  plugins: []
};

export default config;


