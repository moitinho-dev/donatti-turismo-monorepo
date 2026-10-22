import { DeparturePage, departureMetadata, type DepartureCity } from "@/components/site/DeparturePage"

export const revalidate = 300

const d: DepartureCity = {
  city: "São Paulo",
  airport: "GRU",
  path: "/saindo-de-sao-paulo",
  intro: "Pacotes com aéreo saindo de São Paulo (Guarulhos) e hotel no destino, com mais opções de voo direto para o Nordeste e o exterior.",
}

export const metadata = departureMetadata(d)

export default function Page() {
  return <DeparturePage d={d} />
}
