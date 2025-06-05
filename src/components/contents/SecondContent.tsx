// Definindo o tipo para o conteúdo da segunda seção
export type SecondContent = {
  secondtexto1: string // Texto da primeira linha da segunda seção
  secondtexto2: string // Texto da segunda linha da segunda seção
}

// Array de objetos contendo informações para a segunda seção
const Second: SecondContent[] = [
  {
    secondtexto1: "oiapoque ao chuí", // Texto da primeira linha da segunda seção
    secondtexto2:
      "De norte á sul do Brasil,levamos você e sua família para os melhores destinos, com os melhores preços!", // Texto da segunda linha da segunda seção
  },
]

export default Second // Exportando o array de objetos para uso em outros lugares do código
