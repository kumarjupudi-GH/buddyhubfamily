// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

// Dev-only: serve public/apps/<app>/index.html directly so static buddy apps open in the preview.
const serveStaticApps = {
  name: "serve-static-apps",
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = (req.url || "").split("?")[0];
      const m = url.match(/^\/apps\/([\w-]+)\/?(index\.html)?$/);
      if (!m) return next();
      const file = path.join(process.cwd(), "public/apps", m[1], "index.html");
      if (!fs.existsSync(file)) return next();
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(fs.readFileSync(file));
    });
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [serveStaticApps] },
});
