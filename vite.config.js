import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";
// import { createHash } from "crypto";

// function getHash(text) {
//   return createHash("sha256").update(text).digest("hex").substring(0, 8);
// }

// const htmlHashPlugin = {
//   name: "html-hash",
//   enforce: "post",
//   generateBundle(options, bundle) {
//     const indexHtml = bundle["index.html"];
//     indexHtml.fileName = `index.${getHash(indexHtml.source)}.html`;
//   },
// };
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [million.vite({ auto: true }), react()],
});
