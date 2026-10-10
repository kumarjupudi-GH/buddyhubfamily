import { createFileRoute } from "@tanstack/react-router";

// Health check used by both buddy apps' front pages.
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ ok: true, configured: true, ai: true }), {
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
    },
  },
});
