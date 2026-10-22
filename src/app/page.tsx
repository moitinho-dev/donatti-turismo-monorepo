import type { Metadata } from 'next'
import HomeLanding from '@/components/home/HomeLanding'
import { getBlackFridayPhase, isBlackFridayActive } from '@/config/blackFriday'

// A fase da campanha (esquenta / ao vivo / encerrada) é recalculada a cada 5 minutos,
// então a home vira e desvira Black Friday sozinha, sem novo deploy.
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  if (!isBlackFridayActive(getBlackFridayPhase())) return {}

  const title = 'Black Friday Donatti Turismo — Pacotes de viagem com preço de Black Friday'
  const description =
    'Pacotes com aéreo e hotel saindo de Campo Grande e São Paulo, com parcelamento no cartão e atendimento humano no WhatsApp. Tarifas por lote: garanta antes que o preço mude.'

  return {
    title: { absolute: title },
    description,
    // openGraph/twitter substituem o objeto inteiro do layout, então repetimos os campos dele
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://donattiturismo.com.br',
      siteName: 'Donatti Turismo',
      images: [{ url: 'https://donattiturismo.com.br/og-image.jpg', width: 1200, height: 630, alt: 'Donatti Turismo' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://donattiturismo.com.br/twitter-image.jpg'],
    },
  }
}

export default function Home() {
  return <HomeLanding phase={getBlackFridayPhase()} />
}
