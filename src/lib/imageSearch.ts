import { getImageQueries } from "@/lib/destinations"

export type ImageOrientation = "portrait" | "landscape" | "squarish"

export const IMAGE_ORIENTATIONS: ImageOrientation[] = ["portrait", "landscape", "squarish"]

/**
 * Busca fotos para um destino tentando, em ordem, os termos do catálogo
 * (do mais específico ao mais amplo) até completar o limite.
 * Não há fallback para palavras soltas nem termos genéricos: preferimos devolver
 * menos fotos a devolver fotos de outro lugar.
 */
export async function searchDestinationImages(
  destino: string,
  limit: number,
  orientation: ImageOrientation = "portrait",
): Promise<any[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error("Unsplash access key not configured")
  }

  const seen = new Set<string>()
  const results: any[] = []

  for (const q of getImageQueries(destino)) {
    if (results.length >= limit) break
    const batch = await searchUnsplash(q, limit, orientation, accessKey)
    for (const item of batch) {
      if (!item?.id || seen.has(item.id)) continue
      seen.add(item.id)
      results.push(item)
    }
  }

  return results.slice(0, limit)
}

/** URL de uma foto horizontal do destino, para o card do site. */
export async function findSiteImageForDestination(destino: string): Promise<string | null> {
  try {
    const [first] = await searchDestinationImages(destino, 1, "landscape")
    return first?.urls?.regular || first?.urls?.small || null
  } catch (error) {
    console.error("Error finding site image:", error)
    return null
  }
}

async function searchUnsplash(query: string, limit: number, orientation: ImageOrientation, accessKey: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=${orientation}&order_by=relevant&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        // A API do Unsplash tem limite por hora; o mesmo destino não precisa ser buscado de novo no mesmo dia
        next: { revalidate: 60 * 60 * 24 },
      },
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error searching Unsplash:", error)
    return []
  }
}
