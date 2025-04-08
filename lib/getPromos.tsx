export default async function getPromos() {
  const res = await fetch("https://lp-lemonde.vercel.app/api/promosenviadas")
  if (!res.ok) throw new Error("Erro ao buscar dados")
  return res.json()
}
