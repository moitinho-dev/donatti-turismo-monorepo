import { redirect } from "next/navigation"

/**
 * A Black November ocupa a raiz do site ("/") enquanto está ligada; desligada, "/" é a home.
 * Este endereço antigo só manda para "/" (307: a campanha vai e volta, não é mudança permanente).
 * A pré-visualização da equipe continua em /black-november/preview.
 */
export default function BlackNovemberPage() {
  redirect("/")
}
