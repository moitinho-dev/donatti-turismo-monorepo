// Definindo um tipo para o conteúdo do herói
export type HeroContent = {
  herotexto1: string
  herotexto2: string
  herotexto3: string
  herotexto4: string
  herotexto5: string
  herobanner: string
  width: number
  height: number
}

// Array de objetos contendo informações do herói para diferentes seções do site
const Hero: HeroContent[] = [
  {
    herotexto1: "realize seu",
    herotexto2: "SONHO DE\nVIAJAR",
    herotexto3: "Pacotes especiais para sua próxima viagem",
    herotexto4:
      "Descubra os melhores destinos nacionais e internacionais com condições especiais. Atendimento personalizado e suporte completo para criar a viagem perfeita para você.",
    herotexto5: "Explore destinos incríveis e viva experiências inesquecíveis...",
    herobanner: "/assets/HEROATT.png",
    width: 1132,
    height: 907,
  },
  {
    herotexto1: "descubra",
    herotexto2: "O MUNDO",
    herotexto3: "Sua viagem dos sonhos começa aqui",
    herotexto4:
      "Pacotes completos para os melhores destinos do Brasil e do mundo. Condições especiais para reservas antecipadas e atendimento dedicado.",
    herotexto5: "De norte a sul, do Brasil ao mundo, temos o destino perfeito para você...",
    herobanner: "/assets/HEROatt.png",
    width: 1920,
    height: 1080,
  },
]

export default Hero

