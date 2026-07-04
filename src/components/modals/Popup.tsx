"use client"
import Image from "next/image"
import { useState } from "react"
import Foto from "../../../public/assets/NATAL_POPUP.png"

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
)

export function Popup() {
  const [isPopupOpen, setIsPopupOpen] = useState(true)

  const closePopup = () => {
    setIsPopupOpen(false)
  }

  return (
    <div
      className={`fixed inset-0 flex px-14 items-center justify-center z-20 ${
        isPopupOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300 backdrop-blur`}
    >
      <div className="relative w-full max-w-xl bg-gray-100 p-6 rounded-lg shadow-sm">
        <button
          type="button"
          onClick={closePopup}
          className="absolute top-0 right-0 rounded-full border border-gray-200 bg-white p-1 text-gray-400"
        >
          <span className="sr-only">Close</span>
          <CloseIcon />
        </button>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <Image
              alt="Natal Donatti"
              src={Foto}
              className="w-full h-64 sm:h-full object-cover rounded-xl"
              width={1770}
              height={1000}
            />
          </div>

          <div className="sm:col-span-1">
            <h2 className="text-lg font-bold font-mon">Ho Ho Ho, Feliz Natal!</h2>

            <p className="mt-4 text-sm text-gray-500 font-mon">
              Descubra as ofertas irresistíveis da <span className="font-medium"> Donatti Turismo </span>, onde
              proporcionamos experiências de viagem excepcionais com os melhores destinos a preços imbatíveis. Agora,
              você pode realizar seus sonhos de Natal com{" "}
              <span className="font-medium"> parcelamentos de até 15x no cartão e 10x no boleto.</span>
            </p>

            <div className="mt-6 sm:text-right">
              <a
                href="https://api.whatsapp.com/send?phone=556796372769&text=Ol%C3%A1%20gostaria%20de%20verificar%20as%20promo%C3%A7%C3%B5es%20do%20Natal%20Lemonde!%20Poderia%20me%20ajudar%3F"
                className="inline-block rounded-lgpx-5 py-3 text-sm font-medium transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-100 hover:bg-primary-yellow -500 duration-300 w-81 h-22 px-[15px]  bg-yellow-500 rounded-[14px] justify-center items-center gap-[33px]"
              >
                Quero meu presente de Natal!
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

