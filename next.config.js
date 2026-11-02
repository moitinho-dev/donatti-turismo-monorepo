/** @type {import('next').NextConfig} */
const nextConfig = {
  // bcrypt é módulo nativo: fica fora do bundle do servidor
  serverExternalPackages: ["bcrypt", "sharp"],
  // fetchImage/storage leem public/uploads com caminho dinâmico, e o trace copiava o
  // public/ inteiro para dentro das funções (api/ai/image passava de 220 MB, perto do
  // limite de 250 MB da Vercel). O public/ já é servido como estático; a Vercel roda
  // em Linux glibc, então as libs musl do sharp também saem.
  outputFileTracingExcludes: {
    "/*": [
      "./public/assets/**/*",
      "./public/images/**/*",
      "./public/fonts/**/*",
      "./public/icons/**/*",
      "./node_modules/@img/sharp-libvips-linuxmusl-x64/**/*",
      "./node_modules/@img/sharp-linuxmusl-x64/**/*",
    ],
  },
  // A campanha virou Black November; o endereço antigo continua chegando na página
  async redirects() {
    return [
      // Um endereço só: o login (sessão e conexão com a Meta/Google) e o SEO dependem de não alternar entre www e sem www
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.donattiturismo.com" }],
        destination: "https://donattiturismo.com/:path*",
        permanent: true,
      },
      { source: "/black-friday", destination: "/black-november", permanent: true },
      { source: "/black-friday/preview", destination: "/black-november/preview", permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "owqcxfslomrlefrdeomt.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com" },
    ],
  },
}

module.exports = nextConfig
