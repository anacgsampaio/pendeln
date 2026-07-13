import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "pendeln",
        short_name: "pendeln",
        description: "Dein Deutschkurs, in Pendelgröße. 🚃",
        theme_color: "#FAF6EC",
        background_color: "#FAF6EC",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    fs: { allow: [".."] }, // shared code lives in ../pipeline/src
  },
});
