"use client"
import type React from "react"
import { useState } from "react"

interface PlanilhaData {
  [key: string]: string
}

interface FormularioData {
  DESTINO: string
  HOTEL: string
  DE: string
  ATE: string
  MES: string
  ANO: string
  VALOR: string
  COM_CAFE: string | boolean
  SEM_CAFE: string | boolean
  MEIA_PENSAO: string | boolean
  PENSAO_COMPLETA: string | boolean
  ALL_INCLUSIVE: string | boolean
  NUMERO_DE_NOITES: string
  SP: boolean
  CG: boolean
  AEREO: boolean
  [key: string]: string | boolean
}

const PromosForm = ({ updateData }: { updateData: () => void }) => {
  const [formulario, setFormulario] = useState<FormularioData>({
    DESTINO: "",
    HOTEL: "",
    DE: "",
    ATE: "",
    MES: "",
    ANO: "",
    VALOR: "",
    COM_CAFE: false,
    SEM_CAFE: false,
    MEIA_PENSAO: false,
    PENSAO_COMPLETA: false,
    ALL_INCLUSIVE: false,
    NUMERO_DE_NOITES: "",
    SP: false,
    CG: false,
    AEREO: false,
  })
  const [formattedAmount, setFormattedAmount] = useState("")
  const [regimeAlimentacao, setRegimeAlimentacao] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [sheetData, setSheetData] = useState<PlanilhaData[]>([])

  const [camposObrigatorios, setCamposObrigatorios] = useState([
    "DESTINO",
    "HOTEL",
    "DE",
    "ATE",
    "VALOR",
    "NUMERO_DE_NOITES",
  ])
  const handleChange = (campo: keyof FormularioData, valor: string | boolean) => {
    setFormulario((prevFormulario) => {
      let updatedAereo: boolean = prevFormulario.AEREO

      if (campo === "CG" || campo === "SP") {
        updatedAereo = valor as boolean
      }

      let updatedValor: string | boolean = valor
      // Se o campo for 'DESTINO' ou 'HOTEL', converte para maiúsculas
      if (campo === "DESTINO" || campo === "HOTEL") {
        updatedValor = (valor as string).toUpperCase()
      }

      return {
        ...prevFormulario,
        [campo]: updatedValor,
        AEREO: updatedAereo,
      } as FormularioData
    })

    // If the changed field is "ATE" or "DE", update MES, ANO, and DE or ATE
    if (campo === "ATE" && typeof valor === "string") {
      const [ano, mes, dia] = valor.split("-")
      const mesNome = obterNomeMes(Number(mes))
      setFormulario((prevFormulario) => ({
        ...prevFormulario,
        MES: mesNome,
        ANO: ano,
        ATE: `${dia}`,
      }))
    }

    if (campo === "DE" && typeof valor === "string") {
      const [ano, mes, dia] = valor.split("-")
      const mesNome = obterNomeMes(Number(mes))
      setFormulario((prevFormulario) => ({
        ...prevFormulario,
        DE: `${dia}`,
      }))
    }
  }

  const handleChangeRegimeAlimentacao = (valor: string) => {
    setRegimeAlimentacao(valor)

    // Defina apenas a propriedade correspondente no objeto 'formulario' como true
    setFormulario((prevFormulario) => {
      const updatedFormulario: FormularioData = {
        ...prevFormulario,
        COM_CAFE: false,
        SEM_CAFE: false,
        MEIA_PENSAO: false,
        PENSAO_COMPLETA: false,
        ALL_INCLUSIVE: false,
      }

      // Define a propriedade correspondente como true com base no valor selecionado
      if (valor === "COM_CAFE") {
        updatedFormulario.COM_CAFE = true
      } else if (valor === "SEM_CAFE") {
        updatedFormulario.SEM_CAFE = true
      } else if (valor === "MEIA_PENSAO") {
        updatedFormulario.MEIA_PENSAO = true
      } else if (valor === "PENSAO_COMPLETA") {
        updatedFormulario.PENSAO_COMPLETA = true
      } else if (valor === "ALL_INCLUSIVE") {
        updatedFormulario.ALL_INCLUSIVE = true
      }

      return updatedFormulario as FormularioData // Adiciona uma verificação de tipo explícita aqui
    })
  }

  const obterNomeMes = (numeroMes: number) => {
    const meses = ["JAN/", "FEV/", "MAR/", "ABR/", "MAI/", "JUN/", "JUL/", "AGO/", "SET/", "OUT/", "NOV/", "DEZ/"]
    return meses[numeroMes - 1]
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Converter todos os campos para letras maiúsculas
    // Converter apenas os campos 'Destino' e 'Hotel' para letras maiúsculas
    const formularioMaiusculo: FormularioData = {
      ...formulario,
      DESTINO: formulario.DESTINO.toUpperCase(),
      HOTEL: formulario.HOTEL.toUpperCase(),
    }

    const camposFaltando = camposObrigatorios.filter((campo) => !formularioMaiusculo[campo])

    const regimeAlimentacaoPreenchido = !!regimeAlimentacao
    const deInput = document.getElementById("DE") as HTMLInputElement | null
    const ateInput = document.getElementById("ATE") as HTMLInputElement | null

    if (camposFaltando.length === 0 && regimeAlimentacaoPreenchido) {
      try {
        const formData = new FormData()

        Object.entries(formularioMaiusculo).forEach(([key, value]) => {
          // Verifica se o valor é booleano e converte para string
          const formattedValue = typeof value === "boolean" ? String(value) : value
          formData.append(key, formattedValue)
        })

        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbxptP8tdAwjD8k25OcpRYFyGOK2FFgAqsdPfevOh-OOtKehku6xlfu8IQEVBrlm8S1c/exec",
          {
            method: "POST",
            body: formData,
          },
        )

        if (response.ok) {
          // Lógica para lidar com um envio bem-sucedido (pode incluir exibir uma mensagem ao usuário)
          console.log("Dados enviados:", formularioMaiusculo)
          alert("Enviado com sucesso!")
          setEnviado(true)
          resetFormulario()

          if (deInput) {
            deInput.value = ""
          }

          if (ateInput) {
            ateInput.value = ""
          }
          updateData()
        } else {
          // Lógica para lidar com um erro de envio
          alert("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
        }
      } catch (error) {
        console.error("Erro ao enviar o formulário:", error)
        alert("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
      }
    } else {
      alert("Por favor, preencha todos os campos obrigatórios.")
      setCamposObrigatorios(camposFaltando)
      resetFormulario()

      if (deInput) {
        deInput.value = ""
      }

      if (ateInput) {
        ateInput.value = ""
      }
    }
  }

  const resetFormulario = () => {
    // Reinicialize o estado do formulário
    setFormulario({
      DESTINO: "",
      HOTEL: "",
      DE: "",
      ATE: "",
      MES: "",
      ANO: "",
      VALOR: "",
      COM_CAFE: false,
      SEM_CAFE: false,
      MEIA_PENSAO: false,
      PENSAO_COMPLETA: false,
      ALL_INCLUSIVE: false,
      NUMERO_DE_NOITES: "",
      SP: false,
      CG: false,
      AEREO: false,
    })

    // Reinicialize o estado de outros campos, se necessário
    setFormattedAmount("")
    setRegimeAlimentacao("")
  }

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    setFormattedAmount(formatCurrencyValue(inputValue))
    setFormulario((prevFormulario) => ({
      ...prevFormulario,
      VALOR: parseCurrencyValue(inputValue),
    }))
  }

  const parseCurrencyValue = (value: string) => {
    // Remover caracteres não numéricos (exceto ponto e vírgula)
    const cleanedValue = value.replace(/[^\d.,]/g, "")

    // Dividir por 2 e por 15 e arredondar para duas casas decimais
    const numericValue = (Number.parseFloat(cleanedValue.replace(",", ".")) * 10) / 2 / 10

    // Retornar o resultado formatado com duas casas decimais
    return numericValue.toFixed(2).replace(".", ",")
  }

  const formatCurrencyValue = (value: string) => {
    const formattedValue = value.replace(/\D/g, "")
    const numberValue = Number.parseFloat(formattedValue) / 100
    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="col col-span-6 mt-8 md:mt-4 xs:mb-20 xl:mx-auto flex place-self-start items-center p-6 xs:p-2">
      {/* Formulário de busca */}
      <div className="grid grid-cols-1 gap-6 xs:gap-4 bg-primary-orange shadow-lg rounded-lg p-4 md:p-6 w-full md:max-w-[600px] h-[700px]">
        {/* Campos de seleção e entrada */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2">Destino</label>
            <input
              className="border bg-primary-blue font-mon rounded-md text-white w-full"
              type="text"
              id="DESTINO"
              value={formulario.DESTINO}
              onChange={(e) => handleChange("DESTINO", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2">Hotel</label>
            <input
              className="border bg-primary-blue font-mon rounded-md text-white w-full"
              type="text"
              id="HOTEL"
              value={formulario.HOTEL}
              onChange={(e) => handleChange("HOTEL", e.target.value)}
              required
            />
          </div>
        </div>
        {/* Campos de seleção e entrada */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2">Ida</label>
            <input
              type="date"
              className="border bg-primary-blue font-mon rounded-md text-white w-full"
              id="DE"
              onChange={(e) => handleChange("DE", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2">Volta</label>
            <input
              type="date"
              className="border bg-primary-blue font-mon rounded-md text-white w-full"
              id="ATE"
              onChange={(e) => handleChange("ATE", e.target.value)}
            />
          </div>
        </div>
        {/* Campo de valor */}
        <div className="mt-4">
          <label className="block text-primary-blue font-mon font-medium mb-2">Valor</label>
          <input
            placeholder="R$ 00,00"
            name="amount"
            inputMode="numeric"
            type="text"
            className="border bg-primary-blue font-mon rounded-md text-white w-full"
            id="VALOR"
            value={formattedAmount}
            onChange={handleAmountChange}
          />
        </div>
        {/* Menu de seleção para regime de alimentação */}
        <div className="mt-4">
          <label className="block text-primary-blue font-mon font-medium mb-2">Número de noites</label>
          <input
            type="text"
            inputMode="numeric"
            className="border bg-primary-blue font-mon rounded-md text-white w-full"
            id="NUMERO_DE_NOITES"
            value={formulario.NUMERO_DE_NOITES}
            onChange={(e) => handleChange("NUMERO_DE_NOITES", e.target.value)}
          />
        </div>
        {/* Menu de seleção para regime de alimentação */}
        <div className="mt-4">
          <label className="block text-primary-blue font-mon font-medium mb-2">Regime de Alimentação</label>
          <select
            className="border bg-primary-blue font-mon rounded-md text-white w-full"
            id="REGIME_ALIMENTACAO"
            value={regimeAlimentacao}
            onChange={(e) => handleChangeRegimeAlimentacao(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="COM_CAFE">Com Café</option>
            <option value="SEM_CAFE">Sem Café</option>
            <option value="ALL_INCLUSIVE">All Inclusive</option>
            <option value="MEIA_PENSAO">Meia Pensão</option>
            <option value="PENSAO_COMPLETA">Pensão Completa</option>
            {/* Adicione mais opções conforme necessário */}
          </select>
        </div>
        {/* Checkbox para aeroporto de saída */}
        <div className="mt-4">
          <label className="block text-primary-blue font-mon font-medium mb-2">Aeroporto de Saída</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="CG"
              className="mr-2 rounded-md"
              checked={formulario.CG}
              onChange={() => handleChange("CG", !formulario.CG)}
            />
            <label htmlFor="campoGrande" className="text-primary-blue font-mon">
              Campo Grande
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="SP"
              className="mr-2 rounded-md"
              checked={formulario.SP}
              onChange={() => handleChange("SP", !formulario.SP)}
            />
            <label htmlFor="saoPaulo" className="text-primary-blue font-mon">
              São Paulo
            </label>
          </div>
        </div>
        {/* Botão de busca */}
        <div className="flex justify-center mt-4">
          <button
            className="p-2 border w-full md:w-1/2 rounded-md bg-primary-gray text-primary-blue font-mon font-bold"
            onClick={handleSubmit}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromosForm
