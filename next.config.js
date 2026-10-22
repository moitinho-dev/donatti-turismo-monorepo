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
