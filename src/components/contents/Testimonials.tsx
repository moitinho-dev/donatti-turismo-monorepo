// Defina a estrutura dos dados da testemunha
export interface Testimonial {
  id: number
  avatar: string
  stars: number
  author: string
  content: string
}

// Array de testemunhas
const testimonials: Testimonial[] = [
  {
    id: 1,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjWeJ9t_WGL_jn-w50ZMxmZrbnxw9LG1Blx_uvWe22arBWug=w45-h45-p-rp-mo-br100",
    stars: 5,
    author: "Natalia Pamela",
    content:
      "Viajo com a Donatti desde 2021, e só tive experiências maravilhosas, preço, atendimento, dúvidas todas esclarecidas. A Tati da todo apoio e suporte, recomendo de olhos fechados!",
  },
  {
    id: 2,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjXgsqaoskOXWX6AfAoglKAxrB91WwLVib_9ASEVrsFddlo=w45-h45-p-rp-mo-br100",
    stars: 5,
    author: "Daniel Neves",
    content:
      "O atendimento é mega diferenciado, você tem suporte vip! Eles procuram as melhores opções baseado nas espectativas e no bolso do cliente. Super recomendo!",
  },
  {
    id: 3,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjXdlUWq7zu2X5ZWUo0bfigpNpym5Bcr5Z_TkDydu5dGb0W4=w45-h45-p-rp-mo-ba4-br100",
    stars: 5,
    author: "Milton César Machado",
    content:
      "Tati e equipe nota 1000! Viajar com segurança e credibilidade é com a equipe da Tati! Muito obrigado! Até o ano que vem!",
  },
]

export default testimonials
