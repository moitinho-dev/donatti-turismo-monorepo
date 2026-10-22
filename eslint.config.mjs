import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Código legado usa muito `any` e <img>; fica como aviso para não bloquear
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "off",
      // Regras novas do React Compiler: apontam padrões antigos, não bugs; ficam como aviso
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  { ignores: [".next/**", "node_modules/**", "public/**", "chrome-extension/**", "next-env.d.ts"] },
]

export default config
