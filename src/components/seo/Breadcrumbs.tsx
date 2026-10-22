import Link from "next/link"
import { absoluteUrl } from "@/lib/site"
import { JsonLd } from "./JsonLd"

export interface Crumb {
  name: string
  href: string
}

/** Trilha de navegação visível + BreadcrumbList para o Google */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Início", href: "/" }, ...items]
  return (
    <>
      <nav aria-label="Você está em" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="font-medium">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="hover:underline">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
        }}
      />
    </>
  )
}
