import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function FooterSection() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo-donatti.jpg"
                alt="Donatti Turismo"
                width={140}
                height={35}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-600 mb-4">
              Tornando o planejamento de viagens fácil e agradável. Descubra o Brasil com nossos pacotes de viagem
              selecionados.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9" asChild>
                <a href="https://facebook.com/donattiturismo" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9" asChild>
                <a href="https://instagram.com/donattiturismo" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9" asChild>
                <a href="https://twitter.com/donattiturismo" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium uppercase mb-4">Destinos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Bonito - MS
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Rio de Janeiro
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Fernando de Noronha
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Gramado
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Todos os Destinos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium uppercase mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sobre" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/servicos" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Nossos Serviços
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link href="/trabalhe-conosco" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Trabalhe Conosco
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium uppercase mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  Avenida Tamandaré, 8, Vila Planalto
                  <br />
                  Campo Grande, MS - CEP: 79.009-790
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+556796372769" className="hover:text-primary transition-colors">
                  (67) 9637-2769
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:contato@donattiturismo.com.br" className="hover:text-primary transition-colors">
                  contato@donattiturismo.com.br
                </a>
              </li>
              <li className="pt-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a
                    href="https://maps.google.com/?q=Avenida+Tamandaré,+8,+Vila+Planalto,+Campo+Grande,+MS"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver no Mapa
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.1076962871424!2d-54.61994492394826!3d-20.46427935746761!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9486e8f1b0e0b3c3%3A0x3d7f2ff6cc7d1a8d!2sAv.%20Tamandar%C3%A9%2C%208%20-%20Vila%20Planalto%2C%20Campo%20Grande%20-%20MS%2C%2079009-790!5e0!3m2!1spt-BR!2sbr!4v1683654321012!5m2!1spt-BR!2sbr"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-lg shadow-sm"
          ></iframe>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Donatti Turismo. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidade" className="text-gray-500 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-gray-500 hover:text-primary transition-colors">
              Termos de Serviço
            </Link>
            <Link href="/cookies" className="text-gray-500 hover:text-primary transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
