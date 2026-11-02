"use client"

import type { ComponentType, SVGProps } from "react"
import { Globe, MapPin, MessageCircle } from "lucide-react"
import { Facebook, Instagram } from "@/components/ui/brand-icons"
import type { Channel } from "@/lib/channels"
import type { PublishState } from "@/lib/publishState"
import { cardChannels, type ChannelTone } from "./channelStatus"

const TONE: Record<ChannelTone, string> = {
  ok: "bg-emerald-600 text-white",
  simulated: "bg-violet-600 text-white",
  error: "bg-red-600 text-white",
  none: "bg-gray-100 text-gray-500",
}

const ICON: Record<Channel, ComponentType<SVGProps<SVGSVGElement>>> = {
  site: Globe,
  google: MapPin,
  "ig-feed": Instagram,
  "ig-story": Instagram,
  "fb-feed": Facebook,
  "fb-story": Facebook,
  "wa-channel": MessageCircle,
  "wa-status": MessageCircle,
}

/** Stories e Status são redondos (como nos apps); posts, quadrados */
const ROUND = new Set<Channel>(["ig-story", "fb-story", "wa-status"])

/** Linha de ícones com a situação de cada canal da promo */
export function ChannelStatusRow({ states, sitePublished }: { states: Partial<Record<Channel, PublishState>> | undefined; sitePublished: boolean }) {
  const list = cardChannels(states, sitePublished)
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {list.map((c) => {
        const Icon = ICON[c.channel]
        return (
          <li key={c.channel}>
            <span
              role="img"
              aria-label={c.text}
              title={c.text}
              className={`flex h-6 w-6 items-center justify-center ${ROUND.has(c.channel) ? "rounded-full" : "rounded-[5px]"} ${TONE[c.tone]}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
