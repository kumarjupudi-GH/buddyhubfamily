import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/buddy-session")({ server: { handlers: { GET: () => new Response("", { status: 204 }) } } });