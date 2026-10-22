import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Moon, Plane, UtensilsCrossed } from "lucide-react"
import type { Promo } from "@prisma/client"
import { promoDepartures, promoRegime } from "@/lib/publicPromos"
import { promoImageUrl } from "@/lib/site"
import { computeSlug, getPriceNumber } from "@/lib/utils"

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

/** Card de pacote renderizado no servidor (páginas de destino e pacotes relacionados) */
export function PackageCard({ promo, location }: { promo: Promo; location: string }) {
  const slug = computeSlug(promo)
  const total = getPriceNumber(promo.valor)
  const parcelas = promo.parcelas || 10
  const regime = promoRegime(promo)
  const departures = promoDepartures(promo)
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg">
      <Link href={`/pacotes/${slug}`} className="relative block h-44 w-full" tabIndex={-1} aria-hidden="true">
        <Image src={promoImageUrl(promo)} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            <Link
              href={`/pacotes/${slug}`}
              className="hover:text-primary"
              data-analytics-event="select_package"
              data-analytics-params={JSON.stringify({ location, package_slug: slug, destination: promo.destino })}
            >
              {promo.destino} · {promo.hotel}
            </Link>
          </h3>
        </div>
        <ul className="grid gap-1.5 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" aria-hidden="true" /> {promo.dataFormatada}
          </li>
          <li className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" aria-hidden="true" /> {promo.numeroDeNoites} noites
          </li>
          <li className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" aria-hidden="true" /> {promo.aereo ? "Aéreo ida e volta incluso" : "Aéreo sob consulta"}
          </li>
          {regime && (
            <li className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-primary" aria-hidden="true" /> {regime}
            </li>
          )}
          {departures.length > 0 && (
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> Saindo de {departures.join(" e ")}
            </li>
          )}
        </ul>
        {total > 0 && (
          <p className="mt-auto text-gray-900">
            <span className="text-2xl font-bold">
              {parcelas}x {brl(total / parcelas)}
            </span>
            <span className="block text-xs text-gray-500">total {brl(total)} por pessoa</span>
          </p>
        )}
      </div>
    </article>
  )
}
