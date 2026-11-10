export const PROVIDERS = ["chatgpt", "claude", "gemini"] as const;
export type Provider = (typeof PROVIDERS)[number];
export function isProvider(value: unknown): value is Provider {
  return PROVIDERS.some((p) => p === value);
}
export function validModel(provider: Provider, model: string) {
  return /^[a-zA-Z0-9._-]{1,120}$/.test(model) && (
    provider === "chatgpt" ? /^(gpt-|o[134])/.test(model) && !/(audio|realtime|transcribe|tts|image|embedding)/.test(model)
      : provider === "claude" ? model.startsWith("claude-") : model.startsWith("gemini-") && !/(embedding|tts|image|live)/.test(model)
  );
}
export function requireVisitorKey(key: string | null): string {
  if (!key) throw Object.assign(new Error("Connect your own AI account in My AI first."), { status: 403 });
  return key;
}