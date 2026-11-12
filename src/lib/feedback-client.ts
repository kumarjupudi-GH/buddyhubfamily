import { supabase } from "@/integrations/supabase/client";
import { feedbackSchema } from "./feedback";
export async function submitFeedback(input: unknown) {
  const value = feedbackSchema.parse(input);
  const { data } = await supabase.auth.getSession();
  const response = await fetch("/api/public/feedback", {
    method: "POST", headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
    body: JSON.stringify(value),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save feedback");
}
export async function screenshotPng(file: File): Promise<Blob> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Choose a PNG, JPEG or WebP image up to 2 MB");
  const image = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio)); canvas.height = Math.max(1, Math.round(image.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process screenshot");
  context.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("Screenshot is too large");
  return blob;
}