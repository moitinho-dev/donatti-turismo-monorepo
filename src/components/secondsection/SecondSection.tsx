import Image from "next/image"
import BgImage from "../../../public/assets/secondcontent-bg.png"
import Cards from "./SecondCards"
import Second from "../contents/SecondContent"

// Define o componente SecondSection para a segunda seção da página.
export function SecondSection() {
  // Obtém o conteúdo para a segunda seção do array SecondContent.
  const content = Second[0]

  return (
    <section>
      <div className="relative grid grid-cols-1 xl:grid-cols-12 px-14 py-14">
        {/* Coluna 1: Texto */}
        <div className="container col-span-5 place-self-start z-20 text-black">
          <h1 className="font-blo text-5xl xl:text-8xl">{content.secondtexto1}</h1>
          <h1 className="font-mon font-bold xs:text-md xl:text-xl mt-4">{content.secondtexto2}</h1>
        </div>

        {/* Coluna 2: Cartões de conteúdo */}
        <div className="col-span-7 place-self-center z-20">
          <Cards />
        </div>

        {/* Imagem de plano de fundo */}
        <Image className="w-[1998px] h-[689px] left-0 top-0 absolute object-cover z-0" src={BgImage} alt="Bg Image" />
      </div>
    </section>
  )
}
