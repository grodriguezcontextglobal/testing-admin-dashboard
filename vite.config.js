import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { checkEnv, formatEnvReport } from "./src/config/envValidation.js";
import { buildSecurityHeaders, injectSecurityHeaders } from "./src/config/securityHeaders.js";
import { buildApiRuntimeCaching } from "./src/config/offlineCaching.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// FedRAMP A2: IIS serves the security headers from dist/web.config. They are
// written at build time because the CSP names this environment's API origins.
// closeBundle runs after Vite has copied public/ into the output directory.
const securityHeadersPlugin = ({ apiOrigins, enforceCsp }) => {
  let outDir;
  return {
    name: "devitrak-security-headers",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const file = path.join(outDir, "web.config");
      const headers = buildSecurityHeaders({ apiOrigins, enforceCsp });
      fs.writeFileSync(file, injectSecurityHeaders(fs.readFileSync(file, "utf8"), headers));
    },
  };
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_APP_");
  // FedRAMP F0.4: a build stops naming what is wrong; the dev server only
  // prints the report, so a half-filled .env.dev still starts.
  const envCheck = checkEnv(env);
  const envReport = formatEnvReport(envCheck);
  if (command === "build" && envCheck.errors.length) throw new Error(envReport);
  if (envReport) console.warn(envReport);
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
      react(),
      securityHeadersPlugin({ apiOrigins, enforceCsp: env.VITE_APP_CSP_ENFORCE === "true" }),
      // Registered unconditionally, on purpose. This used to be wrapped in
      // `apiOriginPattern ? [...] : []`, so an environment without
      // VITE_APP_DEVITRACK_API (a fresh clone, CI) skipped the plugin
      // entirely — and ServiceWorkerUpdateNotifier.jsx imports
      // "virtual:pwa-register" unconditionally, so `vite build` died with a
      // Rollup resolve error naming that component rather than the missing
      // env var. Only the API runtime-caching rules actually need the
      // origins; see workbox.runtimeCaching below.
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
          // whichever screen the user reaches. API data is not cached, so
          // those screens show what the network gives them.
          navigateFallback: "/index.html",
          // API calls: no response cache, and a short offline queue for
          // writes (src/config/offlineCaching.js, FedRAMP A3). Without API
          // origins nothing is registered; the service worker still ships —
          // shell precache, manifest, update prompt.
          runtimeCaching: buildApiRuntimeCaching(apiOriginPattern),
        },
      }),
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
    },
    // Strip debug logging from the production bundle. `terserOptions` used to
    // ask for this, but Vite minifies with esbuild unless `minify: "terser"`,
    // so it never ran — and terser is not a dependency of this project. `pure`
    // lets esbuild drop the calls whose result is unused. warn and error stay:
    // they are what a production console is for.
    esbuild:
      command === "build"
        ? { pure: ["console.log", "console.info", "console.debug", "console.trace"] }
        : undefined,
  };
});
