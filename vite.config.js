import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";
import { VitePWA } from "vite-plugin-pwa";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 24h retention: long enough to survive a workday offline, bounded so the
// background-sync queue doesn't grow unbounded.
const MUTATION_QUEUE_RETENTION_MINUTES = 24 * 60;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_APP_");
  // Same two origins src/api/serverManager.js fails over between. Kept as a
  // separate, mirrored computation here (this file runs in Node at build
  // time, serverManager.js runs in the browser) — regex must stay a literal
  // built here, since workbox-build serializes it into the generated service
  // worker and can't reach back into this module's closures.
  const apiOrigins = [env.VITE_APP_DEVITRACK_API, env.VITE_APP_DEVITRACK_API_BACKUP]
    .filter(Boolean)
    .map((origin) => origin.trim().replace(/\/$/, ""));
  const apiOriginPattern = apiOrigins.length
    ? new RegExp(`^(${apiOrigins.map(escapeRegExp).join("|")})`)
    : null;

  return {
    server: {
      watch: {
        // Docker Desktop on Windows does not reliably propagate host file events
        // into the container; without polling Vite serves stale modules after
        // git operations (see 2026-07-16 incident: stale roles.js export crash).
        usePolling: true,
        interval: 300,
      },
    },
    plugins: [
      million.vite({ auto: true }),
      react(),
      ...(apiOriginPattern
        ? [
            VitePWA({
              registerType: "prompt",
              injectRegister: null,
              includeAssets: ["devitrak-logo-white.svg"],
              manifest: {
                name: "Devitrak",
                short_name: "Devitrak",
                description: "Devitrak admin dashboard",
                theme_color: "#1976d2",
                background_color: "#ffffff",
                display: "standalone",
                start_url: "/",
                scope: "/",
                icons: [
                  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
                  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
                  {
                    src: "pwa-512x512-maskable.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                  },
                ],
              },
              workbox: {
                // SPA shell: any navigation falls back to the cached index.html
                // when offline, so the client-side router can still render
                // whichever screen the user reaches. "Recent screens" is then
                // bounded naturally by the GET cache below, not by an
                // allowlist of routes.
                navigateFallback: "/index.html",
                runtimeCaching: [
                  {
                    urlPattern: apiOriginPattern,
                    method: "GET",
                    handler: "NetworkFirst",
                    options: {
                      cacheName: "devitrak-recent-data",
                      networkTimeoutSeconds: 4,
                      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
                    },
                  },
                  // Mutation queue: if the device has no network, queue the
                  // POST/PUT and auto-retry once connectivity returns.
                  // Complements (does not replace) the backend's own async
                  // job queue — see FRONTEND_task_queue_changes.md /
                  // backgroundJobsSlice.js. devitrakAWSApi is intentionally
                  // NOT covered here: it's built outside the shared axios
                  // instances/interceptor in src/api/devitrakApi.jsx.
                  {
                    urlPattern: apiOriginPattern,
                    method: "POST",
                    handler: "NetworkOnly",
                    options: {
                      backgroundSync: {
                        name: "devitrak-mutations-queue",
                        options: { maxRetentionTime: MUTATION_QUEUE_RETENTION_MINUTES },
                      },
                    },
                  },
                  {
                    urlPattern: apiOriginPattern,
                    method: "PUT",
                    handler: "NetworkOnly",
                    options: {
                      backgroundSync: {
                        name: "devitrak-mutations-queue",
                        options: { maxRetentionTime: MUTATION_QUEUE_RETENTION_MINUTES },
                      },
                    },
                  },
                ],
              },
            }),
          ]
        : []),
    ],
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
  };
});
