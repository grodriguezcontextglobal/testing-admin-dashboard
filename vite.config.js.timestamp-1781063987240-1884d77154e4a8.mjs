// vite.config.js
import { defineConfig } from "file:///Users/cesar/Library/CloudStorage/OneDrive-Devitrak/Devitrak%20App/Local/testing-admin-dashboard/node_modules/vite/dist/node/index.js";
import react from "file:///Users/cesar/Library/CloudStorage/OneDrive-Devitrak/Devitrak%20App/Local/testing-admin-dashboard/node_modules/@vitejs/plugin-react/dist/index.js";
import million from "file:///Users/cesar/Library/CloudStorage/OneDrive-Devitrak/Devitrak%20App/Local/testing-admin-dashboard/node_modules/million/dist/packages/compiler.mjs";
var vite_config_default = defineConfig({
  plugins: [million.vite({ auto: true }), react()],
  // server: {
  //   port: 5522,
  //   host: "0.0.0.0",
  //   strictPort: true,
  // },
  build: {
    brotliSize: false,
    // Ensures Vite doesn't create multiple chunks that can break static loading if not all chunks are uploaded
    rollupOptions: {
      output: {
        manualChunks: void 0
        // disables chunk splitting for simpler deployment
      }
    },
    chunkSizeWarningLimit: 600,
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2VzYXIvTGlicmFyeS9DbG91ZFN0b3JhZ2UvT25lRHJpdmUtRGV2aXRyYWsvRGV2aXRyYWsgQXBwL0xvY2FsL3Rlc3RpbmctYWRtaW4tZGFzaGJvYXJkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY2VzYXIvTGlicmFyeS9DbG91ZFN0b3JhZ2UvT25lRHJpdmUtRGV2aXRyYWsvRGV2aXRyYWsgQXBwL0xvY2FsL3Rlc3RpbmctYWRtaW4tZGFzaGJvYXJkL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jZXNhci9MaWJyYXJ5L0Nsb3VkU3RvcmFnZS9PbmVEcml2ZS1EZXZpdHJhay9EZXZpdHJhayUyMEFwcC9Mb2NhbC90ZXN0aW5nLWFkbWluLWRhc2hib2FyZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgbWlsbGlvbiBmcm9tIFwibWlsbGlvbi9jb21waWxlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbbWlsbGlvbi52aXRlKHsgYXV0bzogdHJ1ZSB9KSwgcmVhY3QoKV0sXG4gIC8vIHNlcnZlcjoge1xuICAvLyAgIHBvcnQ6IDU1MjIsXG4gIC8vICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gIC8vICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgLy8gfSxcbiAgYnVpbGQ6IHtcbiAgICBicm90bGlTaXplOiBmYWxzZSxcbiAgICAvLyBFbnN1cmVzIFZpdGUgZG9lc24ndCBjcmVhdGUgbXVsdGlwbGUgY2h1bmtzIHRoYXQgY2FuIGJyZWFrIHN0YXRpYyBsb2FkaW5nIGlmIG5vdCBhbGwgY2h1bmtzIGFyZSB1cGxvYWRlZFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCwgLy8gZGlzYWJsZXMgY2h1bmsgc3BsaXR0aW5nIGZvciBzaW1wbGVyIGRlcGxveW1lbnRcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOGMsU0FBUyxvQkFBb0I7QUFDM2UsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sYUFBYTtBQUVwQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsUUFBUSxLQUFLLEVBQUUsTUFBTSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNL0MsT0FBTztBQUFBLElBQ0wsWUFBWTtBQUFBO0FBQUEsSUFFWixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
