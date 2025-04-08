import Image from "next/image"
import LocIcon from "../../../public/assets/LOC_ICON.svg"
import FotoAgencia1 from "../../../public/assets/agencia1.webp"
import FotoAgencia2 from "../../../public/assets/agencia2.jpg"

// Definição do componente 'FifthPhotos'
export function FifthPhotos() {
  return (
    <>
      {/* Primeira unidade da agência */}
      <div className="place-self-start col-span-1 xl:col-span-9 z-10">
        <a href="https://maps.app.goo.gl/25niN2toSbKu2hi97">
          <div className="grid grid-cols-1 mt-4">
            <div className="xs:h-auto xl:h-[667px] xs:w-full md:w-[350px] lg:w-[400px] xl:w-[955px] bg-zinc-300 rounded-[15px] mb-4 relative overflow-hidden cursor-pointer hover:scale-105">
              {/* Renderiza a imagem da primeira unidade */}
              <Image src={FotoAgencia1} alt="Foto Agencia" className="rounded-[15px]" />
            </div>
          </div>
        </a>
      </div>

      {/* Informações da primeira unidade */}
      <div className="col-span-1 xl:col-span-3 flex flex-col z-10 text-black mt-8 xl:-ml-10 xs:ml-0">
        {/* Contêiner do primeiro bloco */}
        <div className="flex mb-4">
          <div className="w-[292px] xl:h-[151px] h-[94px] relative">
            <div className="w-1 xl:h-full xs:h-[94px] left-0 top-0 absolute bg-black" />
            <div className="left-[24px] top-0 absolute xs:text-base xl:text-2xl font-bold font-mon tracking-wider">
              Unidade 1
            </div>
            <div className="left-[24px] top-[30px] xl:top-[52px] absolute xs:text-sm xl:text-base font-normal font-mon tracking-wide">
              Av. Tamandaré
              <br />
              n. 08, Jd. Planalto
              <br />
              Campo Grande - MS
            </div>
          </div>
        </div>
        {/* Ícone de localização (não visível em telas pequenas) */}
        <Image
          className="hidden sm:flex w-[119.25px] h-[175.74px] origin-top-left -rotate-6"
          alt="Icon Location"
          src={LocIcon}
        />
      </div>

      {/* Segunda unidade da agência */}
      <div className=" items-end col-span-1 xl:col-span-5 flex flex-col z-10 text-black mt-8">
        {/* Contêiner do segundo bloco */}
        <div className="flex place-self-end">
          <div className="w-[292px] h-[151px] relative ">
            <div className="right-[24px] top-0 absolute xs:text-base xl:text-2xl font-bold font-mon tracking-wider">
              Unidade 2
            </div>
            <div className="right-[24px] top-[30px] xl:top-[52px] absolute xs:text-sm xl:text-base font-normal font-mon tracking-wide">
              Hipercenter - Av. Ceará, 1553 <br /> Loja 33 - Jardim dos Estados
              <br /> Campo Grande - MS
            </div>
            <div className="w-1 xl:h-full xs:h-[94px] right-0 top-0 absolute bg-black" />
          </div>
        </div>
      </div>

      {/* Informações da segunda unidade */}
      <div className="place-self-end col-span-1 xl:col-span-6 z-10">
        <a href="https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8">
          <div className="grid grid-cols-1 mt-4">
            <div className="xs:h-auto xl:h-[773px] xs:w-full md:w-[350px] lg:w-[400px] xl:w-[630px] bg-zinc-300 rounded-[15px] mb-4 relative overflow-hidden cursor-pointer hover:scale-105">
              {/* Renderiza a imagem da segunda unidade */}
              <Image src={FotoAgencia2} alt="Foto Agencia 2" className="rounded-[15px]" />
            </div>
          </div>
        </a>
      </div>
    </>
  )
}
