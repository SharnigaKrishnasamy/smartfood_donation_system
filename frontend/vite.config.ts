import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // listen on all interfaces so phones/laptops on the same LAN can connect
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
