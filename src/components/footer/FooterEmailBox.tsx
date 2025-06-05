"use client"
import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { FaEnvelope, FaUser, FaCheck } from "react-icons/fa"

export function FooterEmailBox() {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!isCheckboxChecked) {
      setFormError("Você deve aceitar receber promoções para se cadastrar na newsletter.")
      return
    }

    if (!name.trim() || !email.trim()) {
      setFormError("Por favor, preencha todos os campos.")
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFormError("Por favor, insira um email válido.")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwmHixVXy3KsItpn0V8hcc44KWnobnZagi9Mahp4NjOBA8x-cLbbXz3TNxGexd4qWNQYg/exec",
        {
          method: "POST",
          body: formData,
        },
      )

      if (response.ok) {
        setFormSubmitted(true)
        setName("")
        setEmail("")
        setIsCheckboxChecked(false)
      } else {
        setFormError("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error)
      setFormError("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-primary-yellow">
      {formSubmitted ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-primary-blue mb-2 font-mon">Email cadastrado com sucesso!</h3>
          <p className="text-gray-600 font-mon">
            Obrigado por se inscrever. Em breve você receberá nossas melhores ofertas!
          </p>
          <button
            onClick={() => setFormSubmitted(false)}
            className="mt-6 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon"
          >
            Cadastrar outro email
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 font-mon text-sm">
              {formError}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="nome" className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaUser className="mr-2 text-second-blue" /> Qual seu nome?
            </label>
            <input
              name="Name"
              id="nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-primary-blue font-mon font-medium mb-2 flex items-center">
              <FaEnvelope className="mr-2 text-second-blue" /> Qual seu <span className="font-bold">melhor</span>{" "}
              e-mail?
            </label>
            <input
              name="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
              placeholder="seu@email.com"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="aceitarReceber"
                className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue mr-2"
                checked={isCheckboxChecked}
                onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}
              />
              <label htmlFor="aceitarReceber" className="text-primary-blue font-mon">
                Aceito receber as melhores promos no meu e-mail
              </label>
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              type="submit"
              className="w-full md:w-1/2 py-3 bg-primary-yellow text-primary-blue font-mon font-bold rounded-lg shadow-md flex items-center justify-center disabled:opacity-70"
              whileHover={{ scale: 1.05, backgroundColor: "#FED400" }}
              whileTap={{ scale: 0.95 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-blue"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                "QUERO RECEBER"
              )}
            </motion.button>
          </div>
        </form>
      )}
    </div>
  )
}
