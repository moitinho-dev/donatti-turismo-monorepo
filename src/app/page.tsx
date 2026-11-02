import type { Metadata } from 'next'
import HomeLanding from '@/components/home/HomeLanding'
import { getBlackFridayPhase, isBlackFridayActive } from '@/config/blackFriday'
import { getBlackFridaySettings } from '@/lib/blackFridaySettings'
import { CampaignPage } from '@/lib/campaignPage'
import { campaignMetadata } from '@/lib/campaignSeo'
import { pageMeta } from '@/lib/seo'
import { getActivePromos, getDestinations, toPublicPromo } from '@/lib/publicPromos'

// A Black November ocupa a raiz: ligada (esquenta ou ao vivo), "/" é a página da campanha;
// desligada ou encerrada, "/" é a home. A fase e as ofertas são recalculadas a cada 5 minutos,
// então a raiz vira e desvira sozinha pelas datas, sem novo deploy (salvar no painel revalida na hora).
export const revalidate = 300

const DEFAULT_TITLE = 'Donatti Turismo | Pacotes de viagem saindo de Campo Grande e São Paulo'
const DEFAULT_DESCRIPTION =
  'Pacotes de viagem com aéreo e hotel saindo de Campo Grande e São Paulo: Nordeste, Caribe e cruzeiros. Parcelado no cartão, com atendimento no WhatsApp.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlackFridaySettings()
  if (isBlackFridayActive(getBlackFridayPhase(settings))) return campaignMetadata(settings)

  return {
    title: { absolute: DEFAULT_TITLE },
    description: DEFAULT_DESCRIPTION,
    ...pageMeta({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: '/' }),
  }
}

async function loadOffers() {
  try {
    const active = await getActivePromos()
    const destinations = await getDestinations(active)
    return {
      promos: active.slice(0, 60).map(toPublicPromo),
      destinations: destinations.map((d) => ({ name: d.name, slug: d.slug })),
    }
  } catch (error) {
    // Sem banco no build/render: a página carrega as ofertas no navegador
    console.error('Home: não foi possível carregar as ofertas no servidor', error)
    return { promos: undefined, destinations: [] }
  }
}

export default async function Home() {
  const campaign = await getBlackFridaySettings()
  if (isBlackFridayActive(getBlackFridayPhase(campaign))) return <CampaignPage settings={campaign} />

  const { promos, destinations } = await loadOffers()
  return <HomeLanding phase={getBlackFridayPhase(campaign)} campaign={campaign} initialPromos={promos} destinations={destinations} />
}
