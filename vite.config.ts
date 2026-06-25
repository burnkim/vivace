import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    // Don't reload on writes to non-source siblings (the gstack browse audit
    // log, the reference Figma MVP, generated PDFs, etc.).
    watch: {
      ignored: ["**/.gstack/**", "**/figmamvp/**", "**/prototype/**", "**/reference/**", "**/data/**", "**/.git/**"],
    },
  },
});

