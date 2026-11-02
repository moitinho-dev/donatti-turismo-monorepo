# Studio v2: várias promos (plano 2 de 4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O mesmo fluxo de uma promo (Studio → Publicar) para várias promos de uma vez: selecionar na lista, ver todas em grade no Studio, ajustar uma a uma com fila, e publicar todas — com a escolha entre uma publicação por promo ou carrossel único no feed.

**Architecture:** A regra de "quais envios fazer" vira função pura (`bulkPlan.ts`, testada). A publicação de um canal sai do hook `usePublish` para uma função comum (`publishChannel`) usada pelo Publicar de uma promo e pelo de várias. O Studio de várias promos (`StudioMulti`) é um invólucro do `StudioV2`: grade de todas as promos e, ao clicar numa, o editor normal com uma fila embaixo. Tudo atrás de `NEXT_PUBLIC_STUDIO_V2=on`; com a flag desligada nada muda.

**Tech Stack:** Next.js 16, React 19, Konva, Prisma, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-02-studio-e-publicacao-design.md` (seção 6.4; 6.5 só a barra de ações e "Duplicar")

## Global Constraints

- Tudo novo só aparece com `NEXT_PUBLIC_STUDIO_V2 === "on"`. Com a flag desligada a lista, o "Gerar em lote" e o Studio atual ficam exatamente como estão.
- Com a flag ligada, o cartão "Artes em lote" (`BatchGenerator`) some do `/promos`; o arquivo não é apagado neste plano.
- Banco de desenvolvimento = produção: migrações só aditivas (este plano não precisa de nenhuma); nada de publicar de verdade em verificação (só `PUBLISH_SIMULATE=on` ou fetch simulado na página local `src/app/dev-studio`, que fica fora do git).
- Agente só age nas próprias promos (a API já recusa com 403; a interface mostra a mensagem do servidor).
- Carrossel do Instagram e álbum do Facebook: 2 a 10 imagens. Mais de 10 promos com "Carrossel único" → vários carrosséis de até 10, na ordem da seleção.
- Stories: sempre um por promo, sem legenda. Google: sempre um post por promo (paisagem). Site: por promo.
- Canal do WhatsApp: "Mensagem + lote" (uma mensagem com a lista e as imagens quadradas de todas) ou "1 imagem + mensagem" (a primeira promo da seleção). Status do WhatsApp: imagens story de todas, sem texto.
- Interface em português com acentos, sem termos técnicos. Mensagens fixas deste plano estão entre aspas e valem como estão.

## Review Focus

1. **Seleção com promo vencida ou de outro agente** → a promo vencida não pode ser marcada (caixa desabilitada, dica "Promoção vencida"); a de outro agente nem aparece para agente (a lista já filtra). Teste em Task 1 (`selectable`).
2. **11+ promos em "Carrossel único"** → divide em grupos de até 10, na ordem; grupo de 1 vira post simples (a API exige 2+ no grupo). Teste em Task 2.
3. **Falha no meio do lote** (promo 3 de 8 falha no Instagram) → as outras seguem; a 3 mostra erro com "Tentar de novo" só dela; num carrossel, o erro vale para o grupo inteiro e o "Tentar de novo" reenvia o grupo. Teste em Task 2 (`jobsFor` / `retryJob`) e verificação em Task 5.
4. **Fechar o Studio de várias com promos sem nenhum canal publicado nesta sessão** → confirma "Há promoções que ainda não foram publicadas. Fechar mesmo assim?". Teste em Task 4 (`hasUnpublished`).
5. **Republicar em lote** → canais já publicados (e atuais) em alguma promo pedem uma confirmação agregada: "{canal}: {n} promoções já publicadas. Publicar de novo?" (uma por canal). Teste em Task 2 (`republishPrompts`).

---

### Task 1: Seleção na lista e barra de ações (com Duplicar)

**Files:**
- Create: `src/components/promos/dashboard/selection.ts` (lógica pura)
- Create: `src/components/promos/dashboard/BulkActionBar.tsx`
- Modify: `src/components/promos/dashboard/PromoListPanel.tsx`, `PromoGridCard.tsx` (caixa de seleção por promo, "Selecionar todas as visíveis"), `src/components/promos/NewPromosDashboard.tsx` (ações)
- Create: `src/app/api/promos/[id]/duplicate/route.ts`
- Test: `src/components/promos/dashboard/selection.test.ts`, `src/app/api/promos/[id]/duplicate/route.test.ts`

**Interfaces:**
- Produces:
  ```ts
  selectable(p: PromoData, now?: Date): { ok: boolean; reason: string | null }   // vencida → { ok:false, reason:"Promoção vencida" }
  toggleSelection(sel: string[], id: string): string[]                          // mantém a ordem em que foram marcadas
  selectAllVisible(sel: string[], visible: PromoData[], now?: Date): string[]   // só as selecionáveis; preserva as já marcadas primeiro
  BulkActionBar({ count, onOpenStudio, onPublishSite, onUnpublishSite, onDuplicate, onDelete, onClear })
  POST /api/promos/[id]/duplicate → 201 PromoApi  // cópia: mesmos dados da oferta, sitePublished:false, siteSlug:null, sem designs, sem publish logs, sem instagramPostId/googleBusinessPostName, createdById = quem duplicou; agente só duplica as próprias (403)
  ```
- Barra (fixa embaixo, só com seleção ≥1, só com a flag): "{n} selecionada(s)", botões "Abrir no Studio", "Publicar no site", "Tirar do site", "Duplicar", "Excluir", e "Limpar".
  - "Publicar no site" / "Tirar do site": usa o mesmo caminho do botão de cada cartão (inclui o Google ao entrar no site), uma promo por vez; aviso final "{n} publicadas no site." / com falhas "{ok} publicadas; {erro} com erro."
  - "Duplicar": só com 1 selecionada (desabilitado com dica "Duplique uma de cada vez"); depois abre o formulário da cópia.
  - "Excluir": `confirm("Excluir {n} promoções? Isso não pode ser desfeito.")`, uma por vez.
  - "Abrir no Studio": com 1 → Studio normal; com 2+ → `StudioMulti` (Task 4) com os ids na ordem da seleção.

- [ ] **Step 1:** Testes de `selection.ts`: vencida não selecionável com o motivo; `toggleSelection` adiciona no fim e remove; `selectAllVisible` ignora vencidas e mantém a ordem das já marcadas. Testes da rota duplicate (prisma mockado): agente com promo de outro → 403; cópia sem campos de site/post e com `createdById` do usuário; promo inexistente → 404.
- [ ] **Step 2:** Rodar → FAIL. Implementar. Rodar → PASS.
- [ ] **Step 3:** Barra e caixas nos cartões (grade e lista), só com a flag. `npx tsc --noEmit`, eslint.
- [ ] **Step 4:** Commit `feat(promos): seleção de várias promos, barra de ações e duplicar`.

---

### Task 2: Plano de envios em lote (lógica pura) e `publishChannel`

**Files:**
- Create: `src/components/studio/v2/bulkPlan.ts`
- Create: `src/lib/client/publishChannel.ts` (extraído de `src/hooks/usePublish.ts`; o hook passa a usá-lo, sem mudar comportamento)
- Test: `src/components/studio/v2/bulkPlan.test.ts`, `src/lib/client/publishChannel.test.ts`

**Interfaces:**
- Consumes: `Channel`, `CHANNELS` (`src/lib/channels.ts`), `ChannelState`, `needsConfirm` (`src/lib/publishState.ts`), `PublishOptions`, `PublishResult`, `uploadImage` (hoje em `usePublish.ts`), `carouselCaption`, `captionsFor`, `whatsappChannelMessage` (`src/lib/promoCaptions.ts`).
- Produces:
  ```ts
  export type FeedMode = "single" | "carousel"
  export type WaMode = "batch" | "one"
  export interface BulkJob {
    key: string                 // estável: `${channel}:${promoIds.join(",")}`
    channel: Channel
    promoIds: string[]          // 1 = envio de uma promo; 2..10 = carrossel/álbum
    kind: "post" | "story" | "carousel" | "album" | "site" | "share"
  }
  jobsFor(promoIds: string[], channels: Channel[], feed: FeedMode, wa: WaMode): BulkJob[]
  //  ordem: todos os site, depois todos os google, depois os demais canais na ordem de CHANNELS; dentro do canal, na ordem de promoIds
  //  ig-feed/fb-feed + carousel → grupos de até 10; grupo de 1 → kind "post"
  //  wa-channel batch → 1 job "share" com todas; wa-channel one → 1 job "share" com a primeira; wa-status → 1 job "share" com todas
  republishPrompts(jobs: BulkJob[], status: Record<string, Record<Channel, ChannelState>>): { channel: Channel; count: number }[]
  //  conta promos com needsConfirm(state) && !state.stale por canal (só canais com API: não wa-*)
  googleBlockedBySite(job: BulkJob, siteFailed: Set<string>): boolean   // google de promo cujo site falhou nesta rodada
  // publishChannel.ts
  publishChannel(promoId: string, channel: Channel, opts: PublishOptions): Promise<PublishResult>   // mesmo contrato do usePublish.publish
  ```
- [ ] **Step 1:** Testes de `jobsFor`: 3 promos, canais site+google+ig-feed single → 3+3+3 jobs na ordem; ig-feed carousel com 12 promos → grupos [10, 2]; com 11 → [10, 1] e o de 1 é "post"; fb-feed carousel → kind "album"; ig-story sempre 1 por promo; wa-channel one → 1 job com a primeira; wa-status → 1 job com todas. `republishPrompts`: conta só publicados atuais. `googleBlockedBySite`. `publishChannel`: sobe data URL antes (fetch mockado) e repassa `group`.
- [ ] **Step 2:** FAIL → implementar → PASS. `usePublish` usa `publishChannel` (testes existentes continuam verdes).
- [ ] **Step 3:** Commit `feat(publicar): plano de envios em lote e publicação comum`.

---

### Task 3: Fila no editor (anterior / próxima) e alternância formatos ↔ fila

**Files:**
- Create: `src/components/studio/v2/QueueStrip.tsx`
- Modify: `src/components/studio/v2/StudioV2.tsx`, `StudioChrome.tsx` (prop opcional `queue`)

**Interfaces:**
- Produces:
  ```ts
  StudioV2Props += { queue?: { items: { id: string; label: string; thumb: string | null; published: boolean }[]; index: number; onGo: (index: number) => void; onBackToGrid: () => void } }
  QueueStrip({ items, index, onGo })   // miniaturas na ordem, a atual destacada, "Anterior" / "Próxima"
  ```
- Com `queue`: a tira de baixo tem a alternância "Formatos | Fila" (padrão "Fila"); topo mostra "{i}/{n}" e "Voltar à grade" no lugar de "Voltar"; trocar de promo salva a atual antes (mesmo salvamento do fechar). Sem `queue`: nada muda.
- [ ] **Step 1:** Implementar. `npx tsc --noEmit`, eslint.
- [ ] **Step 2:** Verificar na página local `/dev-studio?multi` (criar o modo: 4 promos da API pública, fetch simulado) com Playwright: anterior/próxima trocam a promo; alternância mostra os 4 formatos; prints desktop e celular conferidos.
- [ ] **Step 3:** Commit `feat(studio): fila de promos no editor`.

---

### Task 4: `StudioMulti` — grade de todas as promos e template para todas

**Files:**
- Create: `src/components/studio/v2/StudioMulti.tsx`, `src/components/studio/v2/MultiGrid.tsx`, `src/components/studio/v2/multiState.ts` (lógica pura)
- Modify: `src/components/promos/NewPromosDashboard.tsx` (abre `StudioMulti` com 2+ selecionadas)
- Test: `src/components/studio/v2/multiState.test.ts`

**Interfaces:**
- Consumes: `loadSavedArt`, `buildArtSet`, `applyFamily`, `applyTemplateDocs`, `ArtSet` (`artSet.ts`/`savedArt.ts`), `StudioV2` com `queue` (Task 3), salvamento do Studio (`useArtSaving` / POST `/api/designs`).
- Produces:
  ```ts
  StudioMulti({ promos: PromoData[]; onClose: () => void; onSavePromo: StudioProps["onSavePromo"] })
  // multiState.ts
  defaultFamilyOf(p): "black-november" | "destaque"   // mesma regra do StudioV2
  editedPromos(sets: Record<string, ArtSet>): string[] // promos com edited.length > 0
  hasUnpublished(promoIds: string[], publishedThisSession: Set<string>): boolean
  ```
- Grade: seletor de formato (Story · Feed · Quadrado · Paisagem), uma miniatura por promo (renderizada com `renderDoc` em fila, uma por vez), com destino e selo "Ajustada" quando `edited` não vazio; clicar abre o editor da promo (`StudioV2` com `queue`).
- "Aplicar template em todas": escolhe um Modelo Donatti; se `editedPromos` não vazio → `confirm("Substituir os ajustes de {n} promoções?")`; aplica e salva cada uma.
- Topo: "{n} promoções", "Publicar todas" (Task 5), "Fechar". Fechar com `hasUnpublished` → `confirm("Há promoções que ainda não foram publicadas. Fechar mesmo assim?")`.
- [ ] **Step 1:** Testes de `multiState`. FAIL → implementar → PASS.
- [ ] **Step 2:** Componentes e ligação no painel. tsc, eslint.
- [ ] **Step 3:** Verificar em `/dev-studio?multi` com Playwright (grade, troca de formato, aplicar em todas com confirmação, abrir uma e voltar à grade, fechar com confirmação). Prints conferidos.
- [ ] **Step 4:** Commit `feat(studio): Studio com várias promos em grade`.

---

### Task 5: Publicar todas

**Files:**
- Create: `src/components/studio/v2/BulkPublishSheet.tsx` (reaproveita `ChannelList`, `CaptionTabs`, `ShareWhatsApp`, `ScheduleBox` onde couber)
- Modify: `src/components/studio/v2/StudioMulti.tsx`

**Interfaces:**
- Consumes: `jobsFor`, `republishPrompts`, `googleBlockedBySite` (Task 2), `publishChannel`, `uploadImage`, `GET /api/publish?promoId=` (situação de cada promo), `carouselCaption`, `captionsFor`, `whatsappChannelMessage`.
- Comportamento:
  - Canais como no Publicar de uma promo (Site e Google marcados; Google travado com Site marcado). Escolha no feed (Instagram e Facebook): "Uma publicação por promo" | "Carrossel único" (no Facebook o texto da opção é "Álbum único"). Escolha no Canal do WhatsApp: "Mensagem + lote" | "1 imagem + mensagem".
  - Legendas: com "Uma publicação por promo", cada promo usa a sua (`captionsFor`, ou a salva na arte); com carrossel, `carouselCaption` das promos do grupo, editável antes de publicar.
  - Antes de enviar: uma confirmação por item de `republishPrompts`.
  - Envio na ordem de `jobsFor`, um por vez; cada imagem renderizada uma vez por promo e formato (JPEG 0,9) e reaproveitada.
  - Andamento: tabela promo × canal (carrossel ocupa a linha do grupo) com "enviando", "✓", "Simulado" ou erro; "Tentar de novo" por job.
  - WhatsApp: botões de compartilhar como no Publicar de uma promo (Android / iPhone / computador), com as imagens de todas; marca "compartilhado" em cada promo do job.
  - "Agendar" só no Facebook feed, vale para todos os posts/álbuns dele.
- [ ] **Step 1:** Implementar. tsc, eslint, `npm test`.
- [ ] **Step 2:** Verificar em `/dev-studio?multi` com fetch simulado (nunca `/api/publish` real): 12 promos com carrossel → 2 grupos (10 + 2); uma falha simulada só na promo 3 → as outras ✓, "Tentar de novo" só nela; republicar → confirmação agregada; WhatsApp por aparelho. Prints conferidos.
- [ ] **Step 3:** Commit `feat(studio): publicar várias promos (por promo ou carrossel)`.

---

### Task 6: Flag e entrega

**Files:**
- Modify: `src/components/promos/NewPromosDashboard.tsx` (com a flag: sem o cartão "Artes em lote"; sem a flag: tudo como está)

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run build` → ok.
- [ ] **Step 2:** PR para `main`, merge depois dos checks da Vercel. Em produção a flag continua desligada até o João ligar.
