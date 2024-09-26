import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";

export default defineConfig({
  plugins: [million.vite({ auto: true }), react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting to control how chunks are generated
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // Split large libraries into separate chunks
            if (id.includes("react") || id.includes("react-dom")) {
              return "react";
            }
            if (id.includes("@mui")) {
              return "mui";
            }
            if (id.includes("antd")) {
              return "antd";
            }
            if (id.includes("lodash")) {
              return "lodash";
            }
            if (id.includes("echarts")) {
              return "echarts";
            }
            if (id.includes("echarts-for-react")) {
              return "echarts-for-react";
            }
            if (id.includes("recharts")) {
              return "recharts";
            }
            if (id.includes("react-datepicker")) {
              return "react-datepicker";
            }
            if (id.includes("react-phone-number-input")) {
              return "react-phone-number-input";
            }
            if (id.includes("@uidotdev")) {
              return "uidotdev";
            }
            if (id.includes("@stripe")) {
              return "stripe";
            }
            if (id.includes("react-hook-form")) {
              return "react-hook-form";
            }
            if (id.includes("yup")) {
              return "yup";
            }
            if (id.includes("bcryptjs")) {
              return "bcryptjs";
            }
            return "vendor";
          }
          // Split your app's pages or large components
          if (id.includes("/src/pages/")) {
            return `page-${id.split("/src/pages/")[1].split("/")[0]}`;
          }
          if (id.includes("/src/components/")) {
            return `component-${id.split("/src/components/")[1].split("/")[0]}`;
          }
        },
      },
    },
    // Optimize for smaller bundles and multiple chunks
    chunkSizeWarningLimit: 600, // Adjust this based on your project size
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
  },
});
