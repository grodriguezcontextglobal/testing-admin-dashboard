import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";

export default defineConfig({
  plugins: [million.vite({ auto: true }), react()],
  build: {
    brotliSize: false,
    // Ensures Vite doesn't create multiple chunks that can break static loading if not all chunks are uploaded
    rollupOptions: {
      output: {
        manualChunks: undefined, // disables chunk splitting for simpler deployment
      },
    },
    chunkSizeWarningLimit: 600,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
