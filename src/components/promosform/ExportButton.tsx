"use client"

import type React from "react"
import { Download } from "lucide-react"

interface PromoData {
  DATA_FORMATADA: string
  DESTINO: string
  HOTEL: string
  VALOR: string
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
}

interface ExportButtonProps {
  promos: PromoData[]
}

const ExportButton: React.FC<ExportButtonProps> = ({ promos }) => {
  const handleExport = () => {
    // Função para obter o regime de alimentação
    const getRegimeAlimentacao = (promo: PromoData): string => {
      if (promo.ALL_INCLUSIVE) return "All Inclusive"
      if (promo.PENSAO_COMPLETA) return "Pensão Completa"
      if (promo.MEIA_PENSAO) return "Meia Pensão"
      if (promo.COM_CAFE) return "Com Café"
      if (promo.SEM_CAFE) return "Sem Café"
      return "Não especificado"
    }

    // Função para obter o aeroporto de saída
    const getAeroportoSaida = (promo: PromoData): string => {
      if (promo.CG && promo.SP) return "Campo Grande e São Paulo"
      if (promo.CG) return "Campo Grande"
      if (promo.SP) return "São Paulo"
      return "Não especificado"
    }

    // Função para formatar o valor
    const parseCurrencyValue = (value: string) => {
      if (!value) {
        return "0,00"
      }

      const cleanedValue = value.replace(/[^\d.,]/g, "")
      const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
      const valueAfterCalculation = numericValue * 15 * 2

      return valueAfterCalculation.toFixed(2).replace(".", ",")
    }

    // Criar cabeçalhos para o CSV
    const headers = [
      "Data",
      "Destino",
      "Hotel",
      "Valor (R$)",
      "Regime de Alimentação",
      "Número de Noites",
      "Aeroporto de Saída",
    ]

    // Criar linhas de dados
    const rows = promos.map((promo) => [
      promo.DATA_FORMATADA,
      promo.DESTINO,
      promo.HOTEL,
      parseCurrencyValue(promo.VALOR),
      getRegimeAlimentacao(promo),
      promo.NUMERO_DE_NOITES || "Não especificado",
      getAeroportoSaida(promo),
    ])

    // Combinar cabeçalhos e linhas
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Criar um blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    // Configurar o link
    link.setAttribute("href", url)
    link.setAttribute("download", `promos-lemonde-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    // Adicionar à página, clicar e remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
    >
      <Download className="h-4 w-4" />
      <span>Exportar CSV</span>
    </button>
  )
}

export default ExportButton
