import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#131820",
        court: "#b85f35",
        pine: "#173f35",
        mint: "#d9f2e6",
        chalk: "#f6f2ea",
        gold: "#d6a947",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
