/** JSON-LD renderizado no HTML do servidor. Escapa "<" para textos vindos do banco não fecharem a tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
