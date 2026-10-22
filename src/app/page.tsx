import type { Metadata } from 'next'
import HomeLanding from '@/components/home/HomeLanding'
import { getBlackFridayPhase, isBlackFridayActive } from '@/config/blackFriday'
import { getBlackFridaySettings } from '@/lib/blackFridaySettings'
import { pageMeta } from '@/lib/seo'
import { getActivePromos, getDestinations, toPublicPromo } from '@/lib/publicPromos'

// A fase da campanha (esquenta / ao vivo / encerrada) e as ofertas são recalculadas a cada
// 5 minutos, então a home vira e desvira Black Friday sozinha, sem novo deploy.
export const revalidate = 300

const DEFAULT_TITLE = 'Donatti Turismo | Pacotes de viagem saindo de Campo Grande e São Paulo'
const DEFAULT_DESCRIPTION =
  'Pacotes de viagem com aéreo e hotel saindo de Campo Grande e São Paulo: Nordeste, Caribe e cruzeiros. Parcelado no cartão, com atendimento no WhatsApp.'

export async function generateMetadata(): Promise<Metadata> {
  const bf = isBlackFridayActive(getBlackFridayPhase(await getBlackFridaySettings()))
  const title = bf ? 'Black Friday Donatti Turismo: pacotes de viagem em oferta' : DEFAULT_TITLE
  const description = bf
    ? 'Black Friday de pacotes com aéreo e hotel saindo de Campo Grande e São Paulo. Parcelado no cartão, com atendimento no WhatsApp. Tarifas por lote.'
    : DEFAULT_DESCRIPTION

  return {
    title: { absolute: title },
    description,
    ...pageMeta({ title, description, path: '/' }),
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
  const [{ promos, destinations }, campaign] = await Promise.all([loadOffers(), getBlackFridaySettings()])
  return <HomeLanding phase={getBlackFridayPhase(campaign)} campaign={campaign} initialPromos={promos} destinations={destinations} />
}
