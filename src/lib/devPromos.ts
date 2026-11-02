import type { PublicPromo } from "@/components/home/RealTimePromos"

/**
 * Só em desenvolvimento e sem banco configurado: lê as ofertas da API pública do site no ar
 * para dar para ver as páginas com dados reais. Em produção devolve sempre lista vazia.
 * DEV_PROMOS_SOURCE troca a origem (padrão: https://donattiturismo.com).
 */
export async function devPublicPromos(limit = 40): Promise<PublicPromo[]> {
  if (process.env.NODE_ENV !== "development" || process.env.DATABASE_URL) return []
  const source = process.env.DEV_PROMOS_SOURCE || "https://donattiturismo.com"
  try {
    const res = await fetch(`${source}/api/promos/public?limit=${limit}`, { cache: "no-store" })
    return res.ok ? ((await res.json()) as PublicPromo[]) : []
  } catch {
    return []
  }
}
