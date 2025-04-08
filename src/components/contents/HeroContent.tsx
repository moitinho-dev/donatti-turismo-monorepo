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
    herotexto1: "descubra o",
    herotexto2: "RIO DE JANEIRO",
    herotexto3: "Planejando ir para a cidade maravilhosa?",
    herotexto4:
      "Aqui você encontra todas as informações necessárias para aproveitar ao máximo esse destino e vários outros.",
    herotexto5: "Além do Rio, você merece lugares como estes...",
    herobanner: "/assets/HEROATT.png",
    width: 1132,
    height: 907,
  },
  {
    herotexto1: "descubra",
    herotexto2: "SÃO PAULO",
    herotexto3: "Planejando ir para a cidade?",
    herotexto4: "Descubra as maravilhas de São Paulo e aproveite ao máximo sua viagem.",
    herotexto5: "Além de São Paulo, você merece lugares como estes...",
    herobanner: "/assets/HEROatt.png",
    width: 1920,
    height: 1080,
  },
]

export default Hero
