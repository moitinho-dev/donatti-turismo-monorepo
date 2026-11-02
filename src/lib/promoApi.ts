/** Promo do banco no formato da API do painel (/api/promos) */
export function toApiFormat(promo: {
  id: string
  destino: string
  hotel: string
  dataFormatada: string
  valor: string
  parcelas: number
  comCafe: boolean
  semCafe: boolean
  meiaPensao: boolean
  pensaoCompleta: boolean
  allInclusive: boolean
  numeroDeNoites: string
  sp: boolean
  cg: boolean
  aereo: boolean
  sitePublished: boolean
  siteSection: string | null
  siteSlug: string | null
  siteImage: string | null
  siteDescription: string | null
  siteInclusions: string[]
  siteDepartures: string[]
  valorOriginal: string | null
  campaign: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  createdBy?: { name: string | null }
}) {
  return {
    id: promo.id,
    DESTINO: promo.destino,
    HOTEL: promo.hotel,
    DATA_FORMATADA: promo.dataFormatada,
    VALOR: promo.valor,
    PARCELAS: promo.parcelas,
    COM_CAFE: promo.comCafe,
    SEM_CAFE: promo.semCafe,
    MEIA_PENSAO: promo.meiaPensao,
    PENSAO_COMPLETA: promo.pensaoCompleta,
    ALL_INCLUSIVE: promo.allInclusive,
    NUMERO_DE_NOITES: promo.numeroDeNoites,
    SP: promo.sp,
    CG: promo.cg,
    AEREO: promo.aereo,
    SITE_PUBLISHED: promo.sitePublished,
    SITE_SECTION: promo.siteSection,
    SITE_SLUG: promo.siteSlug,
    SITE_IMAGE: promo.siteImage,
    SITE_DESCRIPTION: promo.siteDescription,
    SITE_INCLUSIONS: promo.siteInclusions,
    SITE_DEPARTURES: promo.siteDepartures,
    VALOR_ORIGINAL: promo.valorOriginal,
    CAMPAIGN: promo.campaign,
    createdAt: promo.createdAt.toISOString(),
    updatedAt: promo.updatedAt.toISOString(),
    createdBy: promo.createdById,
    createdByName: promo.createdBy?.name || null,
  }
}
