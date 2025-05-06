"use client"
import { useState } from "react"
import type React from "react"
import { motion } from "framer-motion"
import { FaSearch, FaPlane, FaCalendarAlt, FaUsers, FaCoffee, FaGlassMartiniAlt, FaCarSide } from "react-icons/fa"

const aeroportosBrasil = [
  { value: "Aracaju - AJU", label: "Aracaju - AJU" },
  { value: "Belém - BEL", label: "Belém - BEL" },
  { value: "Belo Horizonte - CNF", label: "Belo Horizonte - CNF" },
  { value: "Boa Vista - BVB", label: "Boa Vista - BVB" },
  { value: "Brasília - BSB", label: "Brasília - BSB" },
  { value: "Campo Grande - CGR", label: "Campo Grande - CGR" },
  { value: "Cuiabá - CGB", label: "Cuiabá - CGB" },
  { value: "Curitiba - CWB", label: "Curitiba - CWB" },
  { value: "Florianópolis - FLN", label: "Florianópolis - FLN" },
  { value: "Fortaleza - FOR", label: "Fortaleza - FOR" },
  { value: "Goiânia - GYN", label: "Goiânia - GYN" },
  { value: "João Pessoa - JPA", label: "João Pessoa - JPA" },
  { value: "Macapá - MCP", label: "Macapá - MCP" },
  { value: "Maceió - MCZ", label: "Maceió - MCZ" },
  { value: "Manaus - MAO", label: "Manaus - MAO" },
  { value: "Natal - NAT", label: "Natal - NAT" },
  { value: "Palmas - PMW", label: "Palmas - PMW" },
  { value: "Porto Alegre - POA", label: "Porto Alegre - POA" },
  { value: "Porto Velho - PVH", label: "Porto Velho - PVH" },
  { value: "Recife - REC", label: "Recife - REC" },
  { value: "Rio Branco - RBR", label: "Rio Branco - RBR" },
  { value: "Rio de Janeiro - GIG", label: "Rio de Janeiro - GIG" },
  { value: "Rio de Janeiro - SDU", label: "Rio de Janeiro - SDU" },
  { value: "Salvador - SSA", label: "Salvador - SSA" },
  { value: "São Luís - SLZ", label: "São Luís - SLZ" },
  { value: "São Paulo - CGH", label: "São Paulo - CGH" },
  { value: "São Paulo - GRU", label: "São Paulo - GRU" },
  { value: "Teresina - THE", label: "Teresina - THE" },
  { value: "Vitória - VIX", label: "Vitória - VIX" },
]

export function ThirdSearchCard() {
  const [origem, setOrigem] = useState<string>("")
  const [destino, setDestino] = useState<string>("")
  const [dataPartida, setDataPartida] = useState<string>("")
  const [numeroPassageiros, setNumeroPassageiros] = useState<string>("1 Passageiro")
  const [cafeDaManha, setCafeDaManha] = useState<boolean>(false)
  const [allInclusive, setAllInclusive] = useState<boolean>(false)
  const [transfer, setTransfer] = useState<boolean>(false)

  const handleOrigemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOrigem(event.target.value)
  }

  const handleDestinoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDestino(event.target.value)
  }

  const handleDataPartidaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dataSelecionada = new Date(event.target.value)
    const dataFormatada = dataSelecionada.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    setDataPartida(dataFormatada)
  }

  const handleNumeroPassageirosChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNumeroPassageiros(event.target.value)
  }

  const handleCafeDaManhaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCafeDaManha(event.target.checked)
  }

  const handleAllInclusiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAllInclusive(event.target.checked)
  }

  const handleTransferChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTransfer(event.target.checked)
  }

  const handleBuscarClick = () => {
    const mensagem =
      `Olá, gostaria de orçar um pacote saindo de ${origem || "minha cidade"} para ${
        destino || "destino desejado"
      } em ${dataPartida || "data a definir"} para ${numeroPassageiros}.` +
      (cafeDaManha ? " Incluindo café da manhã." : "") +
      (allInclusive ? " Incluindo all inclusive." : "") +
      (transfer ? " Incluindo transfer." : "")

    const mensagemCodificada = encodeURIComponent(mensagem)
    window.open(`https://api.whatsapp.com/send?phone=556796372769&text=${mensagemCodificada}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 border-t-4 border-primary-yellow">
        <h3 className="text-primary-blue font-bold text-xl mb-4 font-mon flex items-center">
          <FaSearch className="mr-2" /> Encontre seu pacote ideal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaPlane className="mr-2 text-second-blue" /> Origem
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800"
              onChange={handleOrigemChange}
            >
              <option value="">Selecione a origem</option>
              {aeroportosBrasil.map((aeroporto, index) => (
                <option key={index} value={aeroporto.value}>
                  {aeroporto.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaPlane className="mr-2 text-second-blue" /> Destino
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800"
              onChange={handleDestinoChange}
            >
              <option value="">Selecione o destino</option>
              {aeroportosBrasil.map((aeroporto, index) => (
                <option key={index} value={aeroporto.value}>
                  {aeroporto.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaCalendarAlt className="mr-2 text-second-blue" /> Data de Partida
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800"
              onChange={handleDataPartidaChange}
            />
          </div>
          <div>
            <label className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaUsers className="mr-2 text-second-blue" /> Número de Passageiros
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800"
              onChange={handleNumeroPassageirosChange}
            >
              <option>1 Passageiro</option>
              <option>2 Passageiros</option>
              <option>3 Passageiros</option>
              <option>+4 Passageiros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cafeDaManha"
              className="mr-2 h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
              onChange={handleCafeDaManhaChange}
            />
            <label htmlFor="cafeDaManha" className="text-primary-blue font-mon flex items-center">
              <FaCoffee className="mr-1 text-second-blue" /> Café da Manhã
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allInclusive"
              className="mr-2 h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
              onChange={handleAllInclusiveChange}
            />
            <label htmlFor="allInclusive" className="text-primary-blue font-mon flex items-center">
              <FaGlassMartiniAlt className="mr-1 text-second-blue" /> All Inclusive
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="transfer"
              className="mr-2 h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
              onChange={handleTransferChange}
            />
            <label htmlFor="transfer" className="text-primary-blue font-mon flex items-center">
              <FaCarSide className="mr-1 text-second-blue" /> Transfer
            </label>
          </div>
        </div>

        <motion.button
          className="w-full py-3 bg-primary-yellow text-primary-blue font-mon font-bold rounded-lg shadow-md flex items-center justify-center"
          onClick={handleBuscarClick}
          whileHover={{ scale: 1.02, backgroundColor: "#FED400" }}
          whileTap={{ scale: 0.98 }}
        >
          <FaSearch className="mr-2" /> ORÇAR
        </motion.button>
      </div>
    </motion.div>
  )
}
