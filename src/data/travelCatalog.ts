export type PackageCategory = 'nacionais' | 'internacionais' | 'cruzeiros' | 'lua-de-mel'

export const categoryLabels: Record<PackageCategory, string> = {
  nacionais: 'Pacotes Nacionais',
  internacionais: 'Pacotes Internacionais',
  cruzeiros: 'Cruzeiros',
  'lua-de-mel': 'Lua de Mel',
}

export interface TravelProduct {
  slug: string
  name: string
  destination: string
  category: PackageCategory
  description: string
  priceFrom: number
  nights: number
  departures: string[]
  departureDates: string[]
  hotel: string
  flightIncluded: boolean
  meals: string
  inclusions: string[]
  image: string
  reviews: {
    rating: number
    count: number
  }
  metadata: {
    title: string
    description: string
    keywords: string[]
  }
}

export const packageCatalog: TravelProduct[] = [
  {
    slug: 'gramado-romantico',
    name: 'Gramado Romântico',
    destination: 'Gramado, RS',
    category: 'lua-de-mel',
    description: 'Pacote pensado para casais, com hospedagem charmosa, fondue e passeio pelas vinícolas de Bento.',
    priceFrom: 3890,
    nights: 5,
    departures: ['São Paulo', 'Campo Grande'],
    departureDates: ['15/07/2025', '29/07/2025', '12/08/2025'],
    hotel: 'Hotel Casa da Montanha ou similar',
    flightIncluded: true,
    meals: 'Café da manhã incluso + noite de fondue',
    inclusions: [
      'Aéreo de ida e volta',
      'Hospedagem superior',
      'Traslado aeroporto-hotel',
      'City tour Gramado e Canela',
    ],
    image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 186 },
    metadata: {
      title: 'Pacote de Lua de Mel em Gramado | Donatti Turismo',
      description:
        'Hospedagem charmosa, passeios românticos e suporte 24/7 para sua lua de mel em Gramado. Consulte datas e condições.',
      keywords: ['Gramado', 'lua de mel', 'pacote romântico', 'fondue', 'Serra Gaúcha'],
    },
  },
  {
    slug: 'lencois-maranhenses-aventura',
    name: 'Lençóis Maranhenses Aventura',
    destination: 'Barreirinhas e Atins, MA',
    category: 'nacionais',
    description: 'Circuito completo pelas lagoas cristalinas com 4x4, passeios de barco e hospedagem boutique.',
    priceFrom: 4780,
    nights: 6,
    departures: ['São Paulo', 'Brasília'],
    departureDates: ['10/06/2025', '24/06/2025', '08/07/2025'],
    hotel: 'Porto Preguiças Resort ou similar',
    flightIncluded: true,
    meals: 'Café da manhã + piquenique nas lagoas',
    inclusions: [
      'Aéreo com bagagem',
      'Hospedagem premium',
      'Traslados 4x4',
      'Passeio de lancha pelo Rio Preguiças',
    ],
    image: 'https://images.unsplash.com/photo-1597680309446-efc9f9a80870?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 122 },
    metadata: {
      title: 'Pacote Lençóis Maranhenses com aéreo | Donatti Turismo',
      description:
        'Explore Lençóis Maranhenses com traslados 4x4, passeios guiados e suporte Donatti. Parcelamento em até 12x.',
      keywords: ['Lençóis Maranhenses', 'pacote nacional', '4x4', 'Barreirinhas', 'Atins'],
    },
  },
  {
    slug: 'fernando-de-noronha-eco',
    name: 'Fernando de Noronha Eco',
    destination: 'Fernando de Noronha, PE',
    category: 'nacionais',
    description: 'Praias paradisíacas, trilhas guiadas e hotelaria sustentável para uma imersão completa.',
    priceFrom: 6520,
    nights: 5,
    departures: ['Recife', 'São Paulo'],
    departureDates: ['05/09/2025', '19/09/2025', '03/10/2025'],
    hotel: 'Pousada Maravilha ou similar',
    flightIncluded: true,
    meals: 'Café da manhã + welcome drink',
    inclusions: [
      'Aéreo com franquia',
      'Hospedagem sustentável',
      'Passeio de barco com golfinhos',
      'Taxas de preservação incluídas',
    ],
    image: 'https://images.unsplash.com/photo-1598972433702-35cfa934ac8a?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 94 },
    metadata: {
      title: 'Pacote Fernando de Noronha com aéreo | Donatti Turismo',
      description:
        'Descubra Noronha com hospedagem selecionada, passeios guiados e suporte 24/7. Reserve com melhor preço garantido.',
      keywords: ['Fernando de Noronha', 'praia', 'ecoturismo', 'pacote com aéreo'],
    },
  },
  {
    slug: 'cancun-all-inclusive',
    name: 'Cancún All Inclusive',
    destination: 'Cancún, México',
    category: 'internacionais',
    description: 'Resort pé na areia, all inclusive, com saída de SP e experiências em Isla Mujeres.',
    priceFrom: 5890,
    nights: 7,
    departures: ['São Paulo', 'Campo Grande'],
    departureDates: ['15/03/2025', '22/03/2025', '05/04/2025'],
    hotel: 'Grand Oasis Cancún ou similar',
    flightIncluded: true,
    meals: 'All Inclusive 24h',
    inclusions: [
      'Aéreo com bagagem',
      'Traslado privativo',
      'Passeio Isla Mujeres',
      'Seguro viagem premium',
    ],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 4.9, count: 214 },
    metadata: {
      title: 'Pacote Cancún All Inclusive | Donatti Turismo',
      description:
        '7 noites em resort all inclusive em Cancún com aéreo e traslados. Melhor preço garantido e cancelamento grátis em ofertas selecionadas.',
      keywords: ['Cancún', 'all inclusive', 'pacote internacional', 'aéreo incluso'],
    },
  },
  {
    slug: 'punta-cana-luxo',
    name: 'Punta Cana Luxo',
    destination: 'Punta Cana, Caribe',
    category: 'internacionais',
    description: 'Resort 5 estrelas com praia privativa, golf e day pass em parque aquático.',
    priceFrom: 5460,
    nights: 7,
    departures: ['São Paulo'],
    departureDates: ['18/04/2025', '02/05/2025', '16/05/2025'],
    hotel: 'Barceló Bávaro Palace ou similar',
    flightIncluded: true,
    meals: 'All Inclusive',
    inclusions: [
      'Aéreo com bagagem',
      'Hospedagem 5*',
      'Traslados',
      'Day pass parque aquático',
    ],
    image: 'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 173 },
    metadata: {
      title: 'Pacote Punta Cana Luxo | Donatti Turismo',
      description: 'All inclusive em resort 5 estrelas em Punta Cana com aéreo, traslados e suporte em português.',
      keywords: ['Punta Cana', 'resort', 'Caribe', 'pacote com aéreo'],
    },
  },
  {
    slug: 'orlando-familia',
    name: 'Orlando Família',
    destination: 'Orlando, EUA',
    category: 'internacionais',
    description: 'Parques da Disney e Universal com hospedagem com cozinha e carro incluso.',
    priceFrom: 7120,
    nights: 8,
    departures: ['São Paulo'],
    departureDates: ['20/06/2025', '04/07/2025', '18/07/2025'],
    hotel: 'Staybridge Suites Lake Buena Vista',
    flightIncluded: true,
    meals: 'Café da manhã americano',
    inclusions: [
      'Aéreo com bagagem',
      'Hospedagem com cozinha',
      'Aluguel de carro com seguro',
      'Assistência em português',
    ],
    image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 4.9, count: 201 },
    metadata: {
      title: 'Pacote Orlando com parques e aéreo | Donatti Turismo',
      description: 'Disney e Universal com hospedagem família, carro incluso e suporte 24/7 no WhatsApp.',
      keywords: ['Orlando', 'Disney', 'Universal', 'viagem em família'],
    },
  },
  {
    slug: 'msc-caribe',
    name: 'Cruzeiro Caribe MSC',
    destination: 'Caribe, saindo de Miami',
    category: 'cruzeiros',
    description: '7 noites pelo Caribe com paradas em Bahamas, Jamaica e México em cabine externa.',
    priceFrom: 4980,
    nights: 7,
    departures: ['Miami'],
    departureDates: ['12/11/2025', '26/11/2025', '10/12/2025'],
    hotel: 'Cabine externa MSC Seascape',
    flightIncluded: false,
    meals: 'Pensão completa a bordo',
    inclusions: [
      'Cabine externa',
      'Refeições e entretenimento',
      'Taxas portuárias',
      'Seguro viagem opcional',
    ],
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 4.8, count: 142 },
    metadata: {
      title: 'Cruzeiro Caribe MSC | Donatti Turismo',
      description: 'Roteiro completo pelo Caribe com pensão completa e facilidades para adicionar o aéreo.',
      keywords: ['cruzeiro', 'MSC', 'Caribe', 'navio'],
    },
  },
  {
    slug: 'fiordes-noruega',
    name: 'Fiordes Noruega',
    destination: 'Noruega',
    category: 'cruzeiros',
    description: 'Navegação pelos fiordes noruegueses com cabine varanda e excursões guiadas.',
    priceFrom: 9380,
    nights: 10,
    departures: ['Copenhague'],
    departureDates: ['03/08/2025', '24/08/2025'],
    hotel: 'Cabine varanda Norwegian',
    flightIncluded: false,
    meals: 'Pensão completa',
    inclusions: [
      'Cabine com varanda',
      'Excursões selecionadas',
      'Entretenimento a bordo',
      'Pacote de bebidas',
    ],
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 88 },
    metadata: {
      title: 'Cruzeiro pelos Fiordes da Noruega | Donatti Turismo',
      description: 'Experiência premium pelos fiordes com pensão completa e excursões inclusas.',
      keywords: ['fiordes', 'Noruega', 'cruzeiro', 'pacote marítimo'],
    },
  },
  {
    slug: 'maldivas-overwater',
    name: 'Maldivas Overwater',
    destination: 'Ilhas Maldivas',
    category: 'lua-de-mel',
    description: 'Bangâlos sobre a água, all inclusive e traslado de hidroavião para uma lua de mel inesquecível.',
    priceFrom: 12490,
    nights: 6,
    departures: ['São Paulo'],
    departureDates: ['02/09/2025', '16/09/2025', '30/09/2025'],
    hotel: 'Centara Ras Fushi Resort',
    flightIncluded: true,
    meals: 'All Inclusive com bebidas',
    inclusions: [
      'Aéreo internacional',
      'Traslado de hidroavião',
      'Hospedagem overwater',
      'Seguro viagem premium',
    ],
    image: 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=1200&q=80',
    reviews: { rating: 5, count: 131 },
    metadata: {
      title: 'Pacote de Lua de Mel nas Maldivas | Donatti Turismo',
      description:
        'Hospedagem overwater all inclusive nas Maldivas com aéreo, traslado de hidroavião e suporte Donatti.',
      keywords: ['Maldivas', 'lua de mel', 'all inclusive', 'overwater'],
    },
  },
]

export function getPackageBySlug(slug: string): TravelProduct | undefined {
  return packageCatalog.find((item) => item.slug === slug)
}

export function getDestinationBySlug(slug: string): TravelProduct | undefined {
  return packageCatalog.find((item) => item.slug === slug)
}
