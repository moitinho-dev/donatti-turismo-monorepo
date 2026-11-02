import { describe, expect, it } from "vitest"
import type { Channel } from "@/lib/channels"
import type { ChannelState } from "@/lib/publishState"
import { googleBlockedBySite, jobsFor, republishPrompts } from "./bulkPlan"

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)
const st = (state: ChannelState["state"], stale = false): ChannelState => ({ state, at: null, by: null, error: null, stale })

describe("jobsFor", () => {
  it("ordem: site, google, depois demais canais; dentro, ordem das promos", () => {
    const jobs = jobsFor(ids(3), ["ig-feed", "google", "site"], "single", "batch")
    expect(jobs.map((j) => `${j.channel}:${j.promoIds.join(",")}`)).toEqual([
      "site:p1", "site:p2", "site:p3", "google:p1", "google:p2", "google:p3", "ig-feed:p1", "ig-feed:p2", "ig-feed:p3",
    ])
    expect(jobs.map((j) => j.kind).slice(0, 7)).toEqual(["site", "site", "site", "post", "post", "post", "post"])
    expect(jobs[0].key).toBe("site:p1")
  })
  it("carrossel com 12 → [10, 2]", () => {
    const jobs = jobsFor(ids(12), ["ig-feed"], "carousel", "batch")
    expect(jobs.map((j) => j.promoIds.length)).toEqual([10, 2])
    expect(jobs.map((j) => j.kind)).toEqual(["carousel", "carousel"])
  })
  it("carrossel com 11 → [10, 1] e o de 1 é post", () => {
    const jobs = jobsFor(ids(11), ["ig-feed"], "carousel", "batch")
    expect(jobs.map((j) => j.promoIds.length)).toEqual([10, 1])
    expect(jobs.map((j) => j.kind)).toEqual(["carousel", "post"])
  })
  it("fb-feed carrossel → album", () => {
    expect(jobsFor(ids(3), ["fb-feed"], "carousel", "batch").map((j) => j.kind)).toEqual(["album"])
  })
  it("stories: um por promo, mesmo em carrossel", () => {
    const jobs = jobsFor(ids(3), ["ig-story", "fb-story"], "carousel", "batch")
    expect(jobs).toHaveLength(6)
    expect(jobs.every((j) => j.kind === "story" && j.promoIds.length === 1)).toBe(true)
  })
  it("wa-channel one → primeira; batch → todas; wa-status → todas", () => {
    expect(jobsFor(ids(3), ["wa-channel"], "single", "one")).toMatchObject([{ promoIds: ["p1"], kind: "share" }])
    expect(jobsFor(ids(3), ["wa-channel"], "single", "batch")).toMatchObject([{ promoIds: ["p1", "p2", "p3"], kind: "share" }])
    expect(jobsFor(ids(3), ["wa-status"], "single", "one")).toMatchObject([{ promoIds: ["p1", "p2", "p3"], kind: "share" }])
  })
  it("só canais presentes; vazio sem promos", () => {
    expect(jobsFor(ids(2), [], "single", "batch")).toEqual([])
    expect(jobsFor([], ["site"], "single", "batch")).toEqual([])
  })
})

describe("republishPrompts", () => {
  it("conta só publicados atuais, canais com API, ordem de CHANNELS", () => {
    const jobs = jobsFor(ids(3), ["ig-feed", "site", "wa-channel"], "single", "batch")
    const none = st("none")
    const base = (): Record<Channel, ChannelState> => ({ site: none, google: none, "ig-feed": none, "ig-story": none, "fb-feed": none, "fb-story": none, "wa-channel": st("shared"), "wa-status": none })
    const status = {
      p1: { ...base(), site: st("published"), "ig-feed": st("scheduled") },
      p2: { ...base(), site: st("published", true), "ig-feed": st("error") },
      p3: { ...base(), site: st("simulated") },
    }
    expect(republishPrompts(jobs, status)).toEqual([{ channel: "site", count: 2 }, { channel: "ig-feed", count: 1 }])
  })
  it("promo sem status é ignorada", () => {
    expect(republishPrompts(jobsFor(ids(1), ["site"], "single", "batch"), {})).toEqual([])
  })
})

describe("googleBlockedBySite", () => {
  it("bloqueia google de promo cujo site falhou", () => {
    const [g] = jobsFor(["p1"], ["google"], "single", "batch")
    expect(googleBlockedBySite(g, new Set(["p1"]))).toBe(true)
    expect(googleBlockedBySite(g, new Set(["p2"]))).toBe(false)
    const [s] = jobsFor(["p1"], ["site"], "single", "batch")
    expect(googleBlockedBySite(s, new Set(["p1"]))).toBe(false)
  })
})
