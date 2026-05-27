import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/pdfjs-dist")) return "pdfjs";
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react";
          return undefined;
        },
      },
    },
  },
});
