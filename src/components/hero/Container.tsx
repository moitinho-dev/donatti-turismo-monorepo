// Importa o tipo ReactNode de React para lidar com os nós (elementos) do React.
import type { ReactNode } from "react"

// Define um tipo de propriedade chamado Props, que inclui uma propriedade chamada 'children' do tipo ReactNode.
type Props = {
  children: ReactNode
}

// Define o componente funcional Container, que recebe um objeto de propriedades 'children'.
export function Container({ children }: Props) {
  // O componente renderiza um contêiner flexível com margens e tamanhos responsivos usando classes do Tailwind CSS.
  return (
    <div className="max-container padding-container flex flex-cols-2 gap-20 py-10 pb-32 md:gap-28 lg:py-20 xl:flex-row">
      {/* Renderiza os componentes filhos (children) passados como propriedade dentro deste contêiner. */}
      {children}
    </div>
  )
}

export function ImageContainer({ children }: Props) {
  return <div className="">{children}</div>
}
