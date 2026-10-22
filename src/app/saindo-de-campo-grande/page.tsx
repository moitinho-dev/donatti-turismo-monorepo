import { DeparturePage, departureMetadata, type DepartureCity } from "@/components/site/DeparturePage"

export const revalidate = 300

const d: DepartureCity = {
  city: "Campo Grande",
  airport: "CGR",
  path: "/saindo-de-campo-grande",
  intro:
    "Pacotes com aéreo saindo do Aeroporto Internacional de Campo Grande (CGR) e hotel no destino, montados por uma agência daqui, da Avenida Tamandaré. Você embarca perto de casa e fala com a mesma especialista do orçamento até a volta.",
}

export const metadata = departureMetadata(d)

export default function Page() {
  return <DeparturePage d={d} />
}
