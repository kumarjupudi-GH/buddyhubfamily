async function encryptionKey() {
  const secret = process.env["VISITOR_AI_ENCRYPTION_SECRET"];
  if (!secret) throw new Error("Secure credential storage is unavailable.");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptVisitorKey(value: string, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) }, await encryptionKey(), new TextEncoder().encode(value));
  return btoa(Array.from(new Uint8Array([...iv, ...new Uint8Array(ciphertext)]), c => String.fromCharCode(c)).join(""));
}
export async function decryptVisitorKey(value: string, owner: string) {
  const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12), additionalData: new TextEncoder().encode(owner) }, await encryptionKey(), bytes.slice(12));
  return new TextDecoder().decode(plain);
}