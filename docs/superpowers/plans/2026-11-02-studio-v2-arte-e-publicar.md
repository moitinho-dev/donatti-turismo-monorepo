# Studio v2: arte em 4 formatos e Publicar com status — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fluxo de uma promo completo: o Studio abre com os 4 formatos sempre juntos, templates aplicam nos 4, e o Publicar (dentro do Studio) posta no site, Instagram, Facebook, Google e WhatsApp com legenda pronta e status salvo por canal.

**Architecture:** A lógica da arte vira funções puras em `src/components/studio/artSet.ts` (testadas). Um Studio novo (`StudioV2`, atrás de `NEXT_PUBLIC_STUDIO_V2=on`) reaproveita o canvas e os painéis atuais com layout no estilo Canva. Toda publicação passa por uma rota única `/api/publish`, que chama as libs existentes (`lib/meta.ts`, `lib/googleBusiness.ts`) e grava um `PublishLog`; com `PUBLISH_SIMULATE=on` nada sai para as redes.

**Tech Stack:** Next.js 16 (App Router; ler `node_modules/next/dist/docs` antes de mudar convenção), React 19, Konva/react-konva, Prisma 6 + Postgres, zod, Vitest (novo, só para lógica pura).

**Spec:** `docs/superpowers/specs/2026-11-02-studio-e-publicacao-design.md`

Este é o plano 1 de 4. Os próximos, escritos ao fim deste: (2) modo várias promos + barra de ações na lista + saída do "Gerar em lote"; (3) Configurações, topo "Para fazer", duplicar e "Salvar e criar outra"; (4) migração dos templates antigos (`layouts`) e saída do TemplateManager.

## Global Constraints

- O banco de desenvolvimento é o da produção: migrações **só aditivas**; nada de apagar ou reescrever `designs`, `layouts` ou `promos` existentes.
- O Studio atual continua sendo o padrão; o novo só aparece com `NEXT_PUBLIC_STUDIO_V2=on`.
- `PUBLISH_SIMULATE=on`: `/api/publish` não chama Meta nem Google, grava o log com status `simulated` e devolve sucesso.
- Formatos: story 1080×1920, feed 1080×1350, square 1080×1080, landscape 1200×628 (`FORMATS` em `studio/types.ts`).
- Canal → formato: `ig-feed`→feed, `ig-story`→story, `fb-feed`→square, `fb-story`→story, `wa-channel`→square, `wa-status`→story, `google`→landscape, `site`→(sem imagem; usa a foto da promo).
- Qualquer pessoa logada publica em todos os canais (Google incluso) e edita templates. Trava de template é aviso, não bloqueio. Conectar contas Meta/Google continua só admin.
- Toda promo publicada no site vai para o Google: no Publicar o Google é marcado e não desmarcável quando o site está marcado.
- Vercel Hobby: 60 s por função, corpo ≤ 4,5 MB → imagens sobem uma a uma antes (`/api/meta/media`, já existe).
- Interface em português com acentos; sem termos técnicos (Vercel, AWS, META_APP_ID) visíveis para a equipe.
- Área segura do story: 250 px em cima e embaixo (já respeitada pelo modelo Black November).

## Review Focus

1. **Republicar sem querer:** canal com status `published` → o botão pede confirmação antes de postar de novo. Teste em Task 6 (`needsConfirm`).
2. **Oferta alterada depois do post:** mudar valor/datas/hotel depois de publicar → status do canal mostra `stale: true`. Teste em Task 5 (`channelStatus` com `offerHash` diferente).
3. **Arte salva antiga com só 1 formato** (produção tem várias) → abre com os 4, os completados marcados em `generated`, nada da arte original perdido. Teste em Task 2 (`completeArtSet`).
4. **Template da equipe antigo de um formato só** (`data` = `StudioDoc`, não `{ formats }`) → aplicar não quebra: o formato salvo entra, os outros vêm do modelo. Teste em Task 3 (`templateDataToSet`).
5. **Falha parcial ao publicar em vários canais** (ex.: Instagram ok, Google erro) → cada canal tem seu status; o erro aparece só no canal que falhou e pode ser reenviado. Teste em Task 6 (rota grava `error` com mensagem; Task 7 manual).

---

### Task 1: Vitest para lógica pura

**Files:**
- Modify: `package.json` (devDependency `vitest@3.2.4`; script `"test": "vitest run"`)
- Create: `vitest.config.ts` (alias `@` → `./src`, `environment: "node"`, `include: ["src/**/*.test.ts"]`)
- Test: `src/lib/utils.test.ts`

- [ ] **Step 1:** Instalar `vitest@3.2.4` (`npm i -D vitest@3.2.4`) e criar `vitest.config.ts` como acima.
- [ ] **Step 2:** Escrever `src/lib/utils.test.ts` com `getPriceNumber("2843.83") === 2843.83` e `getPriceNumber("R$ 2.237,00") === 2237`.
- [ ] **Step 3:** Run `npm test` → Expected: 1 file, PASS. (Se o segundo caso falhar, ajustar a expectativa ao comportamento atual de `getPriceNumber`: o teste documenta, não muda a função.)
- [ ] **Step 4:** Commit `chore: vitest para testes de lógica`.

---

### Task 2: Conjunto de arte (ArtSet) — lógica pura

**Files:**
- Create: `src/components/studio/artSet.ts`
- Modify: `src/components/studio/savedArt.ts` (`SavedDesignData` ganha `captions?: Captions`, `edited?: ArtFormat[]`; `loadSavedArt` passa a devolver `ArtSet` via `completeArtSet`)
- Test: `src/components/studio/artSet.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Captions { instagram: string; facebook: string; whatsapp: string }
  export interface ArtSet {
    docs: Record<ArtFormat, StudioDoc>   // sempre os 4
    family: string | null
    photo: string | null
    edited: ArtFormat[]                   // formatos ajustados à mão depois do template
    generated: ArtFormat[]                // completados agora (não estavam salvos)
    captions: Captions | null
  }
  buildArtSet(familyId: string | null, photo: string | null): ArtSet
  completeArtSet(saved: SavedDesignData, fallbackFamily: string): ArtSet
  applyFamily(set: ArtSet, familyId: string): ArtSet          // refaz os 4, zera edited
  applyTemplateDocs(set: ArtSet, docs: Partial<Record<ArtFormat, StudioDoc>>, fallbackFamily: string): ArtSet
  setPhotoAll(set: ArtSet, url: string): ArtSet
  markEdited(set: ArtSet, format: ArtFormat): ArtSet
  equivalentLayers(set: ArtSet, from: ArtFormat, layerName: string): { format: ArtFormat; layerId: string }[]
  propagate(set: ArtSet, from: ArtFormat, layerName: string, patch: Partial<Layer>): ArtSet
  ```
  `buildArtSet` usa `TEMPLATE_FAMILIES` + `withPhoto` (mesma lógica de `buildFamily` do Studio atual, sem o ramo `legacy`). Só `text`, `fill` e `src` são propagados (patch filtrado); posição e tamanho nunca.

- [ ] **Step 1: Testes que falham** (`artSet.test.ts`):
  - `buildArtSet("black-november", "x.jpg")` → `Object.keys(docs)` = `["story","feed","square","landscape"]`; toda camada `role:"photo"` tem `src:"x.jpg"`; `edited`=[] e `generated`=[].
  - `completeArtSet({ formats: { story: docStory }, family: "destaque", photo: "p.jpg" }, "destaque")` → `docs.story` idêntico (`toEqual`) a `docStory`; `generated` = `["feed","square","landscape"]`.
  - `applyFamily(markEdited(set,"feed"), "clean")` → `edited` = [] e `docs.feed` ≠ o anterior.
  - `setPhotoAll(set, "n.jpg")` → as 4 docs com foto `n.jpg`.
  - `propagate(set, "story", "Destino", { text: "X", x: 999 })` → camada "Destino" de feed/square/landscape com `text:"X"` e `x` inalterado.
  - `equivalentLayers` ignora formatos sem camada de mesmo nome.
- [ ] **Step 2:** Run `npm test -- artSet` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `artSet.ts` e ajustar `savedArt.ts` (`loadSavedArt(promo, fallbackFamily = "destaque")` devolve `ArtSet & { designId: string } | null`). O Studio atual e o `BatchGenerator` usam `loadSavedArt`: manter compatível lendo `.docs` (agora sempre com os 4) — conferir que compilam.
- [ ] **Step 4:** Run `npm test` e `npx tsc --noEmit` → PASS / sem erros.
- [ ] **Step 5:** Commit `feat(studio): ArtSet com os 4 formatos sempre juntos`.

---

### Task 3: Templates da equipe como conjunto + travas + aviso de texto fixo

**Files:**
- Modify: `src/components/studio/types.ts` (`LayerBase` ganha `templateLock?: boolean`)
- Create: `src/components/studio/teamTemplates.ts`
- Test: `src/components/studio/teamTemplates.test.ts`

**Interfaces:**
- Consumes: `ArtSet`, `applyTemplateDocs` (Task 2), `promoVariables` (`variables.ts`).
- Produces:
  ```ts
  export interface TeamTemplateData { formats: Partial<Record<ArtFormat, StudioDoc>> }
  templateDataToSet(data: unknown): Partial<Record<ArtFormat, StudioDoc>>   // aceita {formats} ou StudioDoc antigo
  fixedTextHits(doc: StudioDoc, vars: Record<string, string>): { layerId: string; key: string }[]
  replaceFixedText(doc: StudioDoc, hits: { layerId: string; key: string }[]): StudioDoc
  ```
  `fixedTextHits`: camada `text` cujo texto (trim, sem diferenciar maiúsculas) é igual ao valor de uma variável com 3+ caracteres e que não contém `{`. `replaceFixedText` troca pelo `{KEY}`. Template salvo pelo Studio v2 grava `kind:"template"`, `format:"set"`, `data:{ formats }`.

- [ ] **Step 1: Testes que falham:** `templateDataToSet(storyDoc)` → `{ story: storyDoc }`; `templateDataToSet({ formats: { feed: f } })` → `{ feed: f }`; `fixedTextHits` acha "Maceió" com `vars.DESTINO="Maceió"` e ignora "{DESTINO}" e "OFF"; `replaceFixedText` troca o texto por `"{DESTINO}"`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementar. `GET /api/designs?kind=template&format=...` (já existe) precisa listar também `format:"set"`: em `src/app/api/designs/route.ts`, quando `kind=template` e `format` vier, filtrar `format IN (format, "set")`.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(studio): templates da equipe com os 4 formatos e aviso de texto fixo`.

---

### Task 4: StudioV2 — layout, 4 formatos, templates e dados da oferta

**Files:**
- Create: `src/components/studio/v2/StudioV2.tsx` (estado do ArtSet, histórico desfazer/refazer de `ArtSet`, salvamento automático 4 s, atalhos — mesmo comportamento do `Studio.tsx` atual)
- Create: `src/components/studio/v2/FormatStrip.tsx` (4 miniaturas via `renderDoc(..., { maxWidth: 220 })`, selo "gerado agora" se em `generated`, clique troca o formato)
- Create: `src/components/studio/v2/OfferPanel.tsx` (campos: destino, hotel, datas `DATA_FORMATADA`, noites, parcelas, valor, regime, saída CG/SP; salva via `onSavePromo` 800 ms depois da última tecla)
- Create: `src/components/studio/v2/BrandPanel.tsx` (logos `/images/black-november/logo-black-november.svg`, `/images/black-november/donatti-preto.svg`, `/images/black-november/donatti-negativo-black.svg`, `BRAND.logoLight`, `BRAND.logoDark`; cores `#0A0A0C #FED400 #F79E08 #1D3153 #FFFFFF`; clicar logo adiciona camada imagem)
- Modify: `src/components/studio/panels/TemplatesPanel.tsx` (prop nova `onApplyTemplateSet(docs)`; templates `format:"set"` chamam ela; remove seção "Templates atuais da equipe" quando `variant="v2"`)
- Modify: `src/components/promos/NewPromosDashboard.tsx` (renderiza `StudioV2` quando `process.env.NEXT_PUBLIC_STUDIO_V2 === "on"`, senão `Studio`; mesmas props)

**Interfaces:**
- Consumes: Task 2 (`ArtSet` e funções), Task 3 (`templateDataToSet`, `fixedTextHits`, `replaceFixedText`), `StudioCanvas`, painéis existentes (props listadas no código).
- Produces: `StudioV2Props` = `StudioProps` atual menos `ig` e `gbp`, mais `meta: ReturnType<typeof useMeta>`; o slot do painel Publicar recebe `{ set: ArtSet; promo; getDataUrl(format, mime) ; setCaptions(c: Captions) }` (Task 7 preenche).

Comportamento a garantir (verificação manual no Step 3):
- Abrir promo sem arte: os 4 formatos prontos; família = `"black-november"` se `CAMPAIGN==="black-friday"`, senão `"destaque"`.
- Aplicar modelo com `edited` não vazio → `window.confirm("Substituir os ajustes feitos em {formatos}?")`; cancelar não muda nada.
- Editar texto/cor/foto de camada com equivalentes → barra "Aplicar nos 4 formatos" por 6 s; clicar chama `propagate`.
- Mover, apagar ou recolorir camada com `templateLock` → `confirm("Este elemento é travado no template. Alterar mesmo assim?")`.
- "Salvar como template": se `fixedTextHits` não vazio → `confirm` oferecendo trocar por variáveis; salva os 4 formatos.
- Celular (<1024 px): abas embaixo como hoje; ao abrir, nenhuma gaveta aberta (`tab=null`).

- [ ] **Step 1:** Implementar os arquivos acima.
- [ ] **Step 2:** Run `npx tsc --noEmit` e `npx eslint src/components/studio/v2` → sem erros.
- [ ] **Step 3:** Verificar em `localhost:3100/promos` com `NEXT_PUBLIC_STUDIO_V2=on` (no `.env.local`) numa promo de teste criada para isso: os 6 comportamentos acima; recarregar a página e conferir que os 4 formatos voltaram salvos. Promo de teste excluída ao final.
- [ ] **Step 4:** Commit `feat(studio): Studio v2 com os 4 formatos, marca e dados da oferta`.

---

### Task 5: Registro de publicação (PublishLog)

**Files:**
- Modify: `prisma/schema.prisma` (modelo novo `PublishLog` → tabela `publish_logs`; relação opcional em `Promo` `publishLogs PublishLog[]`)
- Create: `prisma/migrations/20261103120000_publish_logs/migration.sql` (só `CREATE TABLE` + índices `(promoId, channel)` e `(createdAt)`)
- Create: `src/lib/channels.ts`
- Create: `src/lib/publishLog.ts`
- Test: `src/lib/publishLog.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // channels.ts
  export type Channel = "site" | "ig-feed" | "ig-story" | "fb-feed" | "fb-story" | "wa-channel" | "wa-status" | "google"
  export const CHANNELS: { id: Channel; label: string; format: ArtFormat | null; caption: "instagram" | "facebook" | "whatsapp" | null }[]
  // publishLog.ts
  // PublishLog: id, promoId, channel, kind ("post"|"story"|"carousel"|"album"|"message"|"site"), externalId?, status ("published"|"scheduled"|"shared"|"simulated"|"error"), error?, scheduledFor?, offerHash, createdById, createdAt
  offerHash(p: { destino: string; hotel: string; dataFormatada: string; valor: string; parcelas: number | string; numeroDeNoites: string }): string   // sha1 hex dos campos unidos por "|"
  export interface ChannelState { state: "none" | "published" | "scheduled" | "shared" | "simulated" | "error"; at: string | null; by: string | null; error: string | null; stale: boolean }
  channelStatus(logs: { channel: Channel; status: string; createdAt: Date; createdByName?: string | null; error?: string | null; offerHash: string }[], currentHash: string): Record<Channel, ChannelState>
  needsConfirm(state: ChannelState): boolean   // published | scheduled | shared | simulated
  recordPublish(data: Omit<PublishLogCreate, "id" | "createdAt">): Promise<void>
  ```
  `channelStatus` usa o log mais recente por canal; `stale` = estado não é `none`/`error` e `offerHash` ≠ atual.

- [ ] **Step 1: Testes que falham:** `offerHash` igual para mesmos campos e diferente mudando `valor`; `channelStatus` com dois logs do mesmo canal pega o mais novo; `stale:true` quando hash difere; canal sem log → `state:"none"`; `needsConfirm({state:"error"})` false, `({state:"published"})` true.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementar; `npx prisma generate`.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(publicar): registro de publicação por canal`.

---

### Task 6: Rota única `/api/publish` (+ Google com arte, atualização e liberado para a equipe)

**Files:**
- Create: `src/app/api/publish/route.ts` (`POST` publica; `GET ?promoId=` devolve `Record<Channel, ChannelState>`)
- Create: `src/app/api/publish/shared/route.ts` (`POST { promoId, channel: "wa-channel"|"wa-status" }` grava status `shared`)
- Modify: `src/lib/googleBusiness.ts` (`publishPromoPost(promoId, opts?: { imageUrl?: string; replace?: boolean })`: com `replace` e post existente, apaga o post anterior (`DELETE` do `googleBusinessPostName`) e cria o novo; usa `imageUrl` quando vier, senão `siteImage` http como hoje; devolve `{ name: string }`)
- Modify: `src/app/api/google-business/post/route.ts` e `src/app/api/google-business/status/route.ts` (sessão basta; sem exigir admin)
- Modify: `src/hooks/useGoogleBusiness.ts` (lê status para qualquer usuário)
- Modify: `src/app/api/meta/publish/route.ts` (extrair o corpo para `publishMeta(channel, conn, images, caption, scheduledAt)` em `src/lib/meta.ts` e reusar)
- Test: `src/app/api/publish/route.test.ts` (com `vi.mock` de `@/lib/db`, `@/lib/meta`, `@/lib/googleBusiness`, `../meta/session`)

**Interfaces:**
- Consumes: Task 5 (`recordPublish`, `channelStatus`, `offerHash`, `Channel`), `publicImageUrl` e `publishMeta` (`lib/meta.ts`), `publishPromoPost`.
- Produces (body do `POST`, validado com zod):
  ```ts
  { promoId: string; channel: Channel; images: string[] /* URLs públicas já enviadas por /api/meta/media; vazio para "site" */;
    caption?: string; scheduledAt?: string /* ISO, só fb-feed */; group?: { kind: "carousel" | "album"; promoIds: string[] } }
  // resposta: { ok: true; status: ChannelState["state"]; externalId: string | null } | { error: string } (4xx/5xx)
  ```
  - `site`: `prisma.promo.update({ sitePublished: true })` e `revalidatePath("/")`, `revalidatePath("/pacotes/"+slug)`; grava log `kind:"site"`.
  - `google`: exige promo no site (senão 409 "Publique no site antes"); `publishPromoPost(id, { imageUrl: images[0], replace: true })`.
  - `group` presente: um log por `promoIds` com o mesmo `externalId`.
  - `PUBLISH_SIMULATE === "on"`: não chama Meta/Google nem altera `sitePublished`; grava `status:"simulated"`; resposta `{ ok:true, status:"simulated", externalId:null }`.
  - Erro da rede: grava log `status:"error"` com a mensagem e responde 502 `{ error }`.

- [ ] **Step 1: Testes que falham:** (a) simulação ligada → `publishMeta` e `publishPromoPost` não chamados, `recordPublish` com `status:"simulated"`; (b) `google` com promo fora do site → 409; (c) `ig-feed` com Meta lançando `MetaError("x")` → 502 e `recordPublish` com `status:"error", error:"x"`; (d) `group` com 3 promos → `recordPublish` chamado 3 vezes com o mesmo `externalId`; (e) sem sessão → 401.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementar rota, `publishMeta` e mudanças do Google.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(publicar): rota única com simulação, log e Google com a arte`.

---

### Task 7: Painel Publicar do StudioV2

**Files:**
- Create: `src/components/studio/v2/PublishSheet.tsx`
- Create: `src/hooks/usePublish.ts` (`status: Record<Channel, ChannelState> | null`, `refresh()`, `publish(channel, { images, caption, scheduledAt, group })` que sobe imagens por `/api/meta/media` e chama `/api/publish`, `markShared(channel)`)
- Modify: `src/lib/promoCaptions.ts` (`captionsFor(p, campaign): Captions` reunindo `captionFor` instagram/facebook e `whatsappChannelMessage([p])`)
- Modify: `src/components/studio/v2/StudioV2.tsx` (botão "Publicar" no topo abre o painel; legendas salvas em `ArtSet.captions`)

**Interfaces:**
- Consumes: Task 4 slot, Task 5 `CHANNELS`/`needsConfirm`, Task 6 API.
- Produces: `PublishSheet({ promo, set, getDataUrl, setCaptions, onDone })`.

Comportamento (copy fixa entre aspas):
- Lista de canais com caixas, nesta ordem: Site, Google, Instagram feed, Instagram stories, Facebook feed, Facebook stories, Canal do WhatsApp, Status do WhatsApp. Site e Google marcados por padrão; com Site marcado, Google fica marcado e desabilitado com a dica "Toda oferta no site vai para o Google".
- Cada canal mostra o estado: "—", "✓ publicado {data} por {nome}", "Agendado para {data}", "Compartilhado {data}", "Simulado", "Erro: {msg}", e "oferta alterada depois do post" quando `stale`.
- Legenda: abas Instagram / Facebook / WhatsApp, pré-preenchidas por `captionsFor` (ou as salvas), editáveis; mudanças salvam em `ArtSet.captions`.
- Prévia: imagem do formato do canal em foco (`getDataUrl(format, "image/jpeg")`).
- "Agendar" (data e hora) só habilitado se Facebook feed estiver marcado; vale só para ele.
- Botão "Publicar": publica na ordem Site → Google → demais; canais com `needsConfirm` pedem `confirm("{canal} já foi publicado. Publicar de novo?")`; cada canal mostra spinner/✓/erro e "Tentar de novo" no erro.
- WhatsApp (Canal e Status): Android (`/android/i.test(navigator.userAgent)`) → botão "Compartilhar" com `navigator.share({ files, text })`; iPhone/iPad → dois botões "Copiar mensagem" e "Compartilhar imagens"; computador → "Baixar imagens" e "Copiar mensagem". Ao usar qualquer um, chama `markShared`.
- Rodapé: "Baixar" (formato atual ou "Os 4 em .zip") e "Concluir" (fecha o Studio).

- [ ] **Step 1:** Teste de `captionsFor` em `src/lib/promoCaptions.test.ts`: Instagram contém "link na bio" e não contém "http"; Facebook contém `/pacotes/` quando há `SITE_SLUG`; WhatsApp contém o destino.
- [ ] **Step 2:** Run → FAIL; implementar `captionsFor`; Run → PASS.
- [ ] **Step 3:** Implementar `usePublish`, `PublishSheet` e a ligação no `StudioV2`.
- [ ] **Step 4:** `npx tsc --noEmit`, `npx eslint` nos arquivos → sem erros.
- [ ] **Step 5:** Verificar com `PUBLISH_SIMULATE=on` e `NEXT_PUBLIC_STUDIO_V2=on` numa promo de teste: publicar todos os canais → todos "Simulado"; publicar de novo → confirmação; mudar o valor em "Dados da oferta" → "oferta alterada depois do post"; reabrir o Studio → estados e legendas mantidos. Excluir os logs e a promo de teste ao final.
- [ ] **Step 6:** Commit `feat(studio): publicar em todos os canais de dentro do Studio, com status`.

---

### Task 8: Google em toda promo publicada (fora do Studio) e canais na lista

**Files:**
- Modify: `src/app/api/promos/route.ts` (remover os dois `publishPromoPost(...).catch(...)` disparados sem esperar)
- Create: `src/lib/client/postGoogle.ts` (`postGoogleAfterSite(promo: PromoData): Promise<void>`: carrega `loadSavedArt`, renderiza `landscape` com `renderDoc` (se não houver arte, usa `buildArtSet` da família padrão com a foto), sobe por `/api/meta/media` e chama `/api/publish` `channel:"google"`)
- Modify: `src/components/promos/NewPromosDashboard.tsx` (`handleTogglePublish`: depois de publicar no site com sucesso, `await postGoogleAfterSite(updated)`; aviso "Publicado no site e no Google." ou "Publicado no site; o Google falhou: {msg}". `handleFormSuccess`: ao editar uma promo que está no site e já tem post no Google, se o `offerHash` mudou, `await postGoogleAfterSite(saved)` — o post do Google é substituído pelo novo)
- Modify: `src/components/promos/dashboard/PromoGridCard.tsx` e `PromoListPanel.tsx` (linha de ícones de canal com estado; dados de `GET /api/publish/summary`)
- Create: `src/app/api/publish/summary/route.ts` (`GET` → `Record<promoId, Record<Channel, ChannelState["state"]>>` das promos não vencidas, uma consulta agrupada)

- [ ] **Step 1:** Teste de rota `summary` (mock do prisma): dois logs da mesma promo/canal → estado do mais novo.
- [ ] **Step 2:** Run → FAIL; implementar; Run → PASS.
- [ ] **Step 3:** Implementar o resto.
- [ ] **Step 4:** `npx tsc --noEmit` → sem erros; `npm run build` → build ok.
- [ ] **Step 5:** Verificar com `PUBLISH_SIMULATE=on`: publicar no site pela lista → card mostra site ✓ e Google "Simulado".
- [ ] **Step 6:** Commit `feat(promos): Google em toda promo publicada e status de canais na lista`.

---

### Task 9: Entrega

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run build` → tudo ok.
- [ ] **Step 2:** PR para `main` com o resumo e as variáveis novas (`NEXT_PUBLIC_STUDIO_V2`, `PUBLISH_SIMULATE`), merge depois dos checks da Vercel. Em produção as duas ficam desligadas até o João ligar o Studio v2 e fazer o primeiro post real de cada canal.
