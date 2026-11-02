import type { ArtFormat } from "@/components/studio/types"

export type Channel =
  | "site"
  | "ig-feed"
  | "ig-story"
  | "fb-feed"
  | "fb-story"
  | "wa-channel"
  | "wa-status"
  | "google"

export const CHANNELS: {
  id: Channel
  label: string
  format: ArtFormat | null
  caption: "instagram" | "facebook" | "whatsapp" | null
}[] = [
  { id: "site", label: "Site", format: null, caption: null },
  { id: "google", label: "Google", format: "landscape", caption: null },
  { id: "ig-feed", label: "Instagram feed", format: "feed", caption: "instagram" },
  { id: "ig-story", label: "Instagram stories", format: "story", caption: "instagram" },
  { id: "fb-feed", label: "Facebook feed", format: "square", caption: "facebook" },
  { id: "fb-story", label: "Facebook stories", format: "story", caption: "facebook" },
  { id: "wa-channel", label: "Canal do WhatsApp", format: "square", caption: "whatsapp" },
  { id: "wa-status", label: "Status do WhatsApp", format: "story", caption: null },
]

/** Canais publicados pela Meta (Facebook e Instagram) */
export type MetaChannel = Exclude<Channel, "site" | "google" | "wa-channel" | "wa-status">

export const isMetaChannel = (c: Channel): c is MetaChannel => c === "ig-feed" || c === "ig-story" || c === "fb-feed" || c === "fb-story"

/** Tipo do post na Meta: story, carrossel (Instagram) ou álbum (Facebook) quando há mais de uma imagem, senão post */
export function publishKind(channel: MetaChannel, imageCount: number): "post" | "story" | "carousel" | "album" {
  if (channel === "ig-story" || channel === "fb-story") return "story"
  if (imageCount > 1) return channel === "ig-feed" ? "carousel" : "album"
  return "post"
}
