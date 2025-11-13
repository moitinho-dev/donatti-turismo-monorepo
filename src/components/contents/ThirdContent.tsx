// Definindo o tipo para o conteúdo da terceira seção
export type ThirdContent = {
  thirdtexto1: string // Texto da primeira linha da terceira seção
  thirdtexto2: string // Texto da segunda linha da terceira seção
  thirdtexto3: string // Texto da terceira linha da terceira seção
  thirdtexto4: string // Texto da quarta linha da terceira seção
  thirdtexto5: string // Texto da quinta linha da terceira seção
  thirdtexto6: string // Texto da sexta linha da terceira seção
}

// Array de objetos contendo informações para a terceira seção
const Third: ThirdContent[] = [
  {
    thirdtexto1: "pacotes? temos!", // Texto da primeira linha da terceira seção
    thirdtexto2: "Encontre o pacote perfeito para você e sua família em destinos nacionais e internacionais", // Texto da segunda linha da terceira seção
    thirdtexto3: "Voos de ida e volta", // Texto da terceira linha da terceira seção
    thirdtexto4: "Transfer de chegada e saída", // Texto da quarta linha da terceira seção
    thirdtexto5: "Café da manhã", // Texto da quinta linha da terceira seção
    thirdtexto6: "Diárias em hotéis selecionados", // Texto da sexta linha da terceira seção
  },
]

export default Third // Exportando o array de objetos para uso em outros lugares do código

