import Image from "next/image"
import Link from "next/link"
import Logo from "../../../public/assets/logo-preto.png"
import LogoIcon from "../../../public/assets/logo-icon-preto.png"

export function PromosHeader() {
  return (
    <header className="w-full bg-primary-gray shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="hidden sm:block">
            <Image src={Logo || "/placeholder.svg"} alt="Lemonde Tourisme" priority className="h-16 w-auto" />
          </div>
          <div className="sm:hidden">
            <Image src={LogoIcon || "/placeholder.svg"} alt="Lemonde Tourisme" className="h-12 w-auto" />
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/" className="text-primary-blue font-mon font-medium hover:text-second-blue transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </header>
  )
}
