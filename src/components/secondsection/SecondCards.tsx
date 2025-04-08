import IconMala from "../../../public/assets/MALA1.png"
import Image from "next/image"

const Cards = () => {
  return (
    <div className="mx-auto flex flex-col xl:flex-row gap-6 mt-4">
      {/* Primeiro cartão */}
      <div className="xl:w-[290px] xl:h-[570px] xs:w-[305px] xs:h-[200px] bg-zinc-300 rounded-[15px] mb-4 relative">
        <div className="w-[54px] h-[54px] -left-[10px] -top-[13px] absolute bg-white rounded-full">
          <div className="w-[45px] h-[45px] left-[5px] top-[4px] absolute bg-yellow-500 rounded-full"></div>
          <Image className="w-[21px] h-[35px] left-[17px] top-[9px] absolute" alt="Foto" src={IconMala}></Image>
        </div>
        <iframe
          src="https://www.instagram.com/stories/lemondetrip/embed/"
          title="Instagram Story"
          className="w-full h-full rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[17px] object-cover"
        ></iframe>
        <div className="w-full h-[26px] left-[305px] top-auto xl:top-[581px] xl:left-[290px] absolute origin-top-left -rotate-180 bg-yellow-500 rounded-tl-[15px] rounded-tr-[15px]"></div>
      </div>

      {/* Segundo cartão */}
      <div className="xl:w-[290px] xl:h-[570px] xs:w-[305px] xs:h-[200px] bg-zinc-300 rounded-[15px] mb-4 relative">
        <div className="w-[54px] h-[54px] -left-[10px] -top-[13px] absolute bg-white rounded-full">
          <div className="w-[45px] h-[45px] left-[5px] top-[4px] absolute bg-yellow-500 rounded-full"></div>
          <Image className="w-[21px] h-[35px] left-[17px] top-[9px] absolute" alt="Foto" src={IconMala}></Image>
        </div>
        {/* Adicione outro iframe para o segundo card, se necessário */}
      </div>
    </div>
  )
}

export default Cards
