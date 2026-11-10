import { supabase } from "@/integrations/supabase/client";
// Loaded only by static buddies; bearer tokens go exclusively to this origin.
const nativeFetch = window.fetch.bind(window);
const endpoints = new Set(["/api/public/chat", "/api/public/buddy-chat", "/api/public/teach", "/api/public/diagram", "/api/public/picture", "/api/public/visitor-session"]);
window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.href);
  if (url.origin !== window.location.origin || !endpoints.has(url.pathname)) return nativeFetch(input, init);
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (url.pathname !== "/api/public/visitor-session" && !headers.has("X-Request-ID")) headers.set("X-Request-ID", crypto.randomUUID());
  const response = await nativeFetch(input, { ...init, headers });
  if (url.pathname !== "/api/public/visitor-session") updateStatus().catch(() => {});
  return response;
};
async function updateStatus() {
  const response = await window.fetch("/api/public/visitor-session");
  const result = await response.json();
  let strip = document.getElementById("visitor-ai-status");
  if (!strip) { strip = document.createElement("div"); strip.id = "visitor-ai-status"; strip.setAttribute("role", "status"); strip.className = "visitor-ai-status"; const header = document.querySelector("header"); if (header) header.insertAdjacentElement("afterend", strip); }
  strip.replaceChildren();
  const link = document.createElement("a"); link.href = "/account"; link.textContent = response.ok ? "AI account & daily usage" : "An adult needs to sign in and connect their AI account"; strip.append(link);
  if (response.ok && result.level !== "ok") { const warning = document.createElement("span"); warning.setAttribute("role", "alert"); warning.textContent = result.level === "warn" ? " · 80% of your daily budget reached" : " · Your daily budget reached"; strip.append(warning); }
}
const css = document.createElement("style"); css.textContent = ".visitor-ai-status{font:inherit;font-size:13px;padding:8px 12px;flex:none}.visitor-ai-status a{color:inherit;text-decoration:underline}"; document.head.append(css);
updateStatus().catch(() => {});
window.fetch("/api/public/visitor-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});