"use client"
import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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

export function HeroSection() {
  // Estados para os formulários
  const [destino, setDestino] = useState("")
  const [origem, setOrigem] = useState("")
  const [data, setData] = useState<Date>()
  const [viajantes, setViajantes] = useState("")
  const [hotel, setHotel] = useState("")
  const [checkInOut, setCheckInOut] = useState<Date>()
  const [hospedes, setHospedes] = useState("")

  // Função para enviar mensagem para o WhatsApp
  const enviarParaWhatsApp = (tipo: string) => {
    let mensagem = ""

    if (tipo === "pacotes") {
      mensagem = `Olá, gostaria de um orçamento para um pacote com destino a ${destino || "destino a definir"}, saindo de ${origem || "origem a definir"}, na data ${data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "a definir"}, para ${viajantes || "quantidade a definir"} viajante(s).`
    } else if (tipo === "hoteis") {
      mensagem = `Olá, gostaria de um orçamento para hospedagem em ${hotel || "hotel/cidade a definir"}, com check-in/out em ${checkInOut ? format(checkInOut, "dd/MM/yyyy", { locale: ptBR }) : "data a definir"}, para ${hospedes || "quantidade a definir"} hóspede(s).`
    } else if (tipo === "voos") {
      mensagem = `Olá, gostaria de um orçamento para voo saindo de ${origem || "origem a definir"} para ${destino || "destino a definir"}, na data ${data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "a definir"}.`
    }

    const mensagemCodificada = encodeURIComponent(mensagem)
    window.open(`https://wa.me/556796372769?text=${mensagemCodificada}`, "_blank")
  }

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://img.freepik.com/fotos-gratis/bela-praia-tropical-mar-e-oceano-com-coqueiro-e-guarda-chuva-e-cadeira-no-ceu-azul_74190-8827.jpg?t=st=1746560930~exp=1746564530~hmac=9da296fe0aee8df0ea2978ea9398b0da6c6c9ae187163a010d7424f943ad345a&w=996"
          alt="Fernando de Noronha"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Descubra destinos incríveis com a Donatti Turismo
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/90 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Viaje mais pagando menos. Pacotes nacionais e internacionais, passagens aéreas e hospedagem.
          </motion.p>
        </div>

        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue="pacotes" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
              <TabsTrigger value="hoteis">Hotéis</TabsTrigger>
              <TabsTrigger value="voos">Voos</TabsTrigger>
            </TabsList>

            <TabsContent value="pacotes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setDestino}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Para onde?" />
                      </SelectTrigger>
                      <SelectContent>
                        {aeroportosBrasil.map((aeroporto) => (
                          <SelectItem key={aeroporto.value} value={aeroporto.value}>
                            {aeroporto.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origem</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setOrigem}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="De onde?" />
                      </SelectTrigger>
                      <SelectContent>
                        {aeroportosBrasil.map((aeroporto) => (
                          <SelectItem key={aeroporto.value} value={aeroporto.value}>
                            {aeroporto.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal pl-10",
                            !data && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {data ? format(data, "dd/MM/yy", { locale: ptBR }) : "Quando?"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={data}
                          onSelect={setData}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Viajantes</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setViajantes}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Quantos?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Viajante</SelectItem>
                        <SelectItem value="2">2 Viajantes</SelectItem>
                        <SelectItem value="3">3 Viajantes</SelectItem>
                        <SelectItem value="4+">4+ Viajantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => enviarParaWhatsApp("pacotes")}>
                  <Search className="h-4 w-4" />
                  Orçar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hoteis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cidade ou hotel"
                      className="pl-10"
                      value={hotel}
                      onChange={(e) => setHotel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Check-in/out</label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal pl-10",
                            !checkInOut && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {checkInOut ? format(checkInOut, "dd/MM/yy", { locale: ptBR }) : "Datas"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkInOut}
                          onSelect={setCheckInOut}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Hóspedes</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setHospedes}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Quantos?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hóspede</SelectItem>
                        <SelectItem value="2">2 Hóspedes</SelectItem>
                        <SelectItem value="3">3 Hóspedes</SelectItem>
                        <SelectItem value="4+">4+ Hóspedes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => enviarParaWhatsApp("hoteis")}>
                  <Search className="h-4 w-4" />
                  Orçar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="voos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origem</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setOrigem}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="De onde?" />
                      </SelectTrigger>
                      <SelectContent>
                        {aeroportosBrasil.map((aeroporto) => (
                          <SelectItem key={aeroporto.value} value={aeroporto.value}>
                            {aeroporto.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select onValueChange={setDestino}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Para onde?" />
                      </SelectTrigger>
                      <SelectContent>
                        {aeroportosBrasil.map((aeroporto) => (
                          <SelectItem key={aeroporto.value} value={aeroporto.value}>
                            {aeroporto.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal pl-10",
                            !data && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          {data ? format(data, "dd/MM/yy", { locale: ptBR }) : "Quando?"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={data}
                          onSelect={setData}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => enviarParaWhatsApp("voos")}>
                  <Search className="h-4 w-4" />
                  Orçar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}
