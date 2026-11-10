import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isProvider, validModel, requireVisitorKey, type Provider } from "./visitor-ai-policy";

export const selectionSchema = z.object({ provider: z.enum(["chatgpt", "claude", "gemini"]), model: z.string().min(1).max(120) });
export async function visitorIdentity(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw Object.assign(new Error("Sign in to use your own AI account."), { status: 401 });
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Account service is unavailable.");
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("apikey", key);
    headers.set("authorization", authorization);
    return fetch(input, { ...init, headers });
  } } });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw Object.assign(new Error("Please sign in again."), { status: 401 });
  return data.user.id;
}
async function encryptionKey() {
  const secret = process.env["VISITOR_AI_ENCRYPTION_SECRET"];
  if (!secret) throw new Error("Private AI storage is unavailable.");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptKey(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return JSON.stringify({ v: 1, iv: Array.from(iv), data: Array.from(new Uint8Array(ciphertext)) });
}
async function decryptKey(value: string) {
  try {
    const stored = z.object({ v: z.literal(1), iv: z.array(z.number()).length(12), data: z.array(z.number()) }).parse(JSON.parse(value));
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(stored.iv) }, await encryptionKey(), new Uint8Array(stored.data)));
  } catch { throw Object.assign(new Error("Reconnect your AI account in My AI."), { status: 403 }); }
}
export async function getVisitorKey(userId: string, provider: Provider) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("visitor_ai_keys").select("ciphertext").eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (error) throw new Error("Could not read your AI connection.");
  return requireVisitorKey(data ? await decryptKey(data.ciphertext) : null);
}
export async function providerRequest(provider: Provider, key: string, path: string, body?: unknown) {
  const base = provider === "chatgpt" ? "https://api.openai.com/v1" : provider === "claude" ? "https://api.anthropic.com/v1" : "https://generativelanguage.googleapis.com/v1beta";
  const headers = new Headers({ "content-type": "application/json" });
  if (provider === "claude") { headers.set("x-api-key", key); headers.set("anthropic-version", "2023-06-01"); }
  else if (provider === "gemini") headers.set("x-goog-api-key", key);
  else headers.set("authorization", `Bearer ${key}`);
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw Object.assign(new Error(response.status === 401 || response.status === 403 ? "Your AI provider rejected access. Check your key and model permissions in My AI." : response.status === 429 ? "Your AI account has reached a usage or rate limit. Check your provider account before trying again." : "Your AI provider could not complete this request. No other provider was used."), { status: response.status });
  return response.json();
}
export async function listProviderModels(provider: Provider, key: string): Promise<string[]> {
  const raw = await providerRequest(provider, key, "/models");
  const parsed = z.object({ data: z.array(z.object({ id: z.string() })).optional(), models: z.array(z.object({ name: z.string(), supportedGenerationMethods: z.array(z.string()).optional() })).optional() }).parse(raw);
  const ids = provider === "gemini" ? (parsed.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => m.name.replace(/^models\//, "")) : (parsed.data || []).map(m => m.id);
  return ids.filter(id => validModel(provider, id)).sort();
}
export async function askVisitor(request: Request, selection: unknown, options: { system: string; messages: Array<{role: "user" | "assistant"; content: string}>; maxTokens: number }) {
  const userId = await visitorIdentity(request);
  const parsed = selectionSchema.safeParse(selection);
  if (!parsed.success || !isProvider(parsed.data.provider) || !validModel(parsed.data.provider, parsed.data.model)) throw Object.assign(new Error("Choose an available AI model first."), { status: 400 });
  const { provider, model } = parsed.data;
  const key = await getVisitorKey(userId, provider);
  let text = "", truncated = false;
  if (provider === "claude") {
    const raw = await providerRequest(provider, key, "/messages", { model, system: options.system, messages: options.messages, max_tokens: options.maxTokens });
    const data = z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })), stop_reason: z.string().nullable().optional() }).parse(raw);
    text = data.content.filter(b => b.type === "text").map(b => b.text || "").join(""); truncated = data.stop_reason === "max_tokens";
  } else if (provider === "chatgpt") {
    const raw = await providerRequest(provider, key, "/responses", { model, instructions: options.system, input: options.messages, max_output_tokens: options.maxTokens });
    const data = z.object({ output: z.array(z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() })), status: z.string().optional() }).parse(raw);
    text = data.output.flatMap(o => o.content || []).filter(c => c.type === "output_text").map(c => c.text || "").join(""); truncated = data.status === "incomplete";
  } else {
    const raw = await providerRequest(provider, key, `/models/${model}:generateContent`, { systemInstruction: { parts: [{ text: options.system }] }, contents: options.messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: options.maxTokens } });
    const data = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })) }).optional(), finishReason: z.string().optional() })).optional() }).parse(raw);
    text = (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || "").join(""); truncated = data.candidates?.[0]?.finishReason === "MAX_TOKENS";
  }
  return { text, truncated, model, provider };
}