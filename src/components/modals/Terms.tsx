"use client"
import { useEffect } from "react"
import type { ReactElement } from "react"
import { motion, AnimatePresence } from "framer-motion"

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
)

type TermsProps = {
  isOpen: boolean
  onClose: () => void
}

export function Terms({ isOpen, onClose }: TermsProps): ReactElement | null {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const termsAndConditionsText = `
  <p><strong>Termos de Uso:</strong></p>
  <p>Ao acessar ou utilizar este site (a seguir denominado "Site"), você concorda em ficar vinculado a estes Termos de Uso e a todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</p>
  <p>Este Site é fornecido pela DONATTI TURISMO (CNPJ 41.887.394/0001-29) e destina-se ao uso pessoal e não comercial. Você concorda em não modificar, distribuir, transmitir, realizar engenharia reversa, descompilar, criar trabalhos derivados ou utilizar de qualquer outra forma o conteúdo deste Site, exceto conforme expressamente autorizado por nós por escrito.</p>
  <p>Ao usar este Site, você concorda em fornecer informações precisas, atuais e completas. Você é responsável por manter a confidencialidade de suas informações de conta e por todas as atividades que ocorrem sob sua conta.</p>
  <p>Os materiais exibidos ou disponibilizados através deste Site, incluindo, mas não se limitando a textos, gráficos, logotipos, ícones, imagens, áudio e vídeo, são de propriedade exclusiva da DONATTI TURISMO ou de seus licenciadores e estão protegidos pelas leis de direitos autorais.</p>
  <p>A DONATTI TURISMO não será responsável por quaisquer danos diretos, indiretos, incidentais, consequenciais ou punitivos decorrentes do uso ou incapacidade de usar este Site.</p>
  <p>Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Ao continuar a acessar ou usar o Site após a publicação de quaisquer modificações, você concorda em ficar vinculado aos termos modificados.</p>
  
  <p><strong>Política de Privacidade:</strong></p>
  <p>Ao usar este Site, podemos coletar informações pessoais fornecidas por você, como nome, endereço de e-mail e outras informações necessárias para atender às suas solicitações.</p>
  <p>As informações pessoais fornecidas serão utilizadas para responder a consultas, processar pedidos e fornecer informações sobre nossos produtos e serviços. Não compartilharemos suas informações pessoais com terceiros, exceto conforme necessário para cumprir com as leis aplicáveis.</p>
  <p>Podemos usar cookies e outras tecnologias semelhantes para melhorar a experiência do usuário, personalizar conteúdo e anúncios, fornecer recursos de mídia social e analisar o tráfego.</p>
  <p>Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado ou divulgação. No entanto, não podemos garantir a segurança completa das informações transmitidas pela internet.</p>
  <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos ou fazer perguntas sobre nossa política de privacidade, entre em contato conosco.</p>
  <p>Reservamo-nos o direito de modificar esta Política de Privacidade a qualquer momento. As alterações entrarão em vigor após a publicação no Site. Ao utilizar este Site, você concorda com os termos desta Política de Privacidade.</p>
  `

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white p-6 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 p-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-gray-100 p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>

            <h2 className="text-2xl font-bold text-primary-blue mb-4 font-mon">Termos e Política de Privacidade</h2>

            <div className="max-h-[60vh] overflow-y-auto pr-2 text-gray-700 font-mon text-sm leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: termsAndConditionsText }} />
            </div>

            <div className="mt-6 text-right">
              <motion.button
                onClick={onClose}
                className="px-6 py-2 bg-primary-blue text-white font-mon font-medium rounded-lg shadow-md"
                whileHover={{ scale: 1.05, backgroundColor: "#2a4675" }}
                whileTap={{ scale: 0.95 }}
              >
                Entendi e Aceito
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

