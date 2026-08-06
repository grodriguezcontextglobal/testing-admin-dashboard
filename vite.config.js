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
            // Without this, vite-plugin-pwa only emits the manifest/service
            // worker on `vite build` — the dev server (`npm run dev`,
            // docker compose up) never registers a service worker, so the
            // browser has nothing to base an install decision on and
            // `beforeinstallprompt` never fires. This is why the install
            // banner/footer link never appeared while testing against the
            // dev server.
            devOptions: {
              enabled: true,
              type: "module",
            },
            manifest: {
              id: "/",
              name: "Devitrak",
              short_name: "Devitrak",
              description: "Devitrak admin dashboard",
              theme_color: "#1976d2",
              background_color: "#ffffff",
              display: "standalone",
              start_url: "/",
              scope: "/",
              // Chrome's install criteria need a 192px and a 512px icon with
              // the default "any" purpose — the two pwa-* entries below cover
              // that and must stay. The maskable entry is additive: Android
              // applies its own mask (circle/squircle) and crops anything
              // outside the central 80% safe zone, so it needs artwork with
              // margin and a full-bleed background, which a plain "any" icon
              // usually isn't. One 512px maskable is enough — the launcher
              // downscales it; the 48/72/96/128/384 variants the generator
              // emits are pre-mask Android legacy and only bloat the
              // precache.
              icons: [
                { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
                { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
                {
                  src: "maskable_icon_x512.png",
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
                    // Workbox requires a unique Queue name per
                    // BackgroundSyncPlugin instance — one is created per
                    // runtimeCaching entry, so POST and PUT each need
                    // their own name even though they're conceptually the
                    // same "mutation queue" (reusing one name here throws
                    // duplicate-queue-name at service-worker startup and
                    // was silently breaking SW activation).
                    backgroundSync: {
                      name: "devitrak-mutations-queue-post",
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
                      name: "devitrak-mutations-queue-put",
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
