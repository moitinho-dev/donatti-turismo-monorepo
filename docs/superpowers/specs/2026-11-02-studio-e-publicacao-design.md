# Studio e publicação de promos (redesenho)

Data: 2026-11-02 · Sistema: `/promos` (Donatti Turismo)

## 1. Intenção

Quem usa é a equipe de atendimento da Donatti, não designers. Uma tarifa nova precisa virar oferta no site e post nas redes em minutos, no padrão visual da marca (ou da campanha do momento, como a Black November), sem a pessoa montar arte do zero e sem erro.

O fluxo é este, e só este (decisão do João):

> **cadastrou → Studio → postou (Instagram, Facebook, WhatsApp) → baixa a imagem se quiser → fecha.**

Não existe etapa de "revisão" entre cadastro e Studio. O mesmo fluxo precisa funcionar para **uma promo** e para **várias promos de uma vez**.

Hoje o sistema falha nisso por quatro motivos:

1. **A arte não é um conjunto.** O Studio abre só no story; feed, quadrado e paisagem só existem se alguém abrir um por um. Trocar de modelo apaga os outros formatos. O lote completa o que falta com o modelo, e os formatos ficam com visuais diferentes.
2. **Templates que nunca funcionam.** São três tipos, cada um quebra de um jeito:
   - "Templates atuais da equipe" (tabela `layouts`): PNG de fundo e textos posicionados, convertidos em tempo real por `legacyLayoutToDoc`. A conversão aproxima a fonte, a largura e o recorte da foto, então nunca bate com a prévia. Só tem story e feed e imprime o WhatsApp antigo (67) 9 9637-2769.
   - "Modelos Donatti" (`TEMPLATE_FAMILIES` em código): são os únicos que funcionam nos 4 formatos.
   - "Templates da equipe" (`Design kind=template`): salvam só o formato aberto e podem levar texto fixo (destino e preço de outra promo) no lugar de variável.
3. **Publicar não tem memória.** Não se sabe se uma promo já foi postada. O lote deixa clicar de novo e duplica o post. O Studio usa a conexão antiga do Instagram, enquanto o lote usa a da Meta. Facebook e WhatsApp não existem no Studio. A legenda começa vazia e se perde ao fechar.
4. **Duas telas para a mesma coisa.** O "Gerar em lote" é um segundo editor, separado do Studio.

## 2. Objetivos

- **Arte da promo = sempre os 4 formatos** (story 1080×1920, feed 1080×1350, quadrado 1080×1080, paisagem 1200×628), gerados juntos ao abrir e coerentes entre si.
- **Um tipo de template só**: conjunto dos 4 formatos, feito de variáveis, com elementos travados. Aplicar um template muda os 4 formatos.
- **Studio no estilo Canva / Adobe Express** (referências na coleção Mobbin "Donatti · Studio e painel de promos"):
  - barra de ícones à esquerda com painel retrátil
  - arte no centro
  - tira de miniaturas embaixo
  - "Publicar" fixo no canto superior direito
- **Publicar de dentro do Studio** em todos os canais, com legenda pronta e editável, e status persistido por canal.
- **Várias promos no mesmo Studio**, no padrão "Criação em massa" do Adobe Express: grade com todas, ajuste individual e "Publicar todas". O "Gerar em lote" atual deixa de existir como tela separada.
- **Lista do `/promos` com seleção múltipla e barra de ações em lote**, que é a porta de entrada do modo de várias promos.

## 3. Não objetivos (desta rodada)

- Redesenhar a tela de Leads (projeto à parte).
- Aposentar os painéis legados `/admin` e `/agent` e o login `/login` (projeto à parte). Esta rodada não mexe neles.
- Importar várias tarifas de um PDF de uma vez. O modo de várias promos parte de promos já cadastradas (selecionadas na lista).
- Agendamento no Instagram. A API não agenda; precisaria de fila e cron. No Facebook o agendamento continua disponível.
- Vídeo, animação e Reels.

## 4. Anti-objetivos (falha mesmo se "funcionar")

- Formatos da mesma promo com visuais diferentes.
- Trocar de template e perder ajuste feito à mão sem aviso.
- Postar a mesma promo duas vezes no mesmo canal sem querer.
- Arte com destino, preço ou telefone de outra promo (texto fixo vazando de template).
- A especialista precisar entender termos técnicos (Vercel, META_APP_ID, AWS) para usar o Studio.
- Lote ou Studio fechando e jogando fora artes geradas sem perguntar.

## 5. Decisões já tomadas (pelo João)

| Tema | Decisão |
|---|---|
| Fluxo | cadastrou → Studio → postou → baixa se quiser → fecha. Sem etapa de revisão. |
| Várias promos | O mesmo fluxo vale para várias promos. |
| Várias promos no feed | **A pessoa escolhe**: uma publicação por promo **ou** um carrossel único. |
| Stories | Lote **sem legenda** (Instagram e Status do WhatsApp). |
| Feed (IG/FB) | **Sempre com legenda.** |
| Canal do WhatsApp | **Uma mensagem com a lista + o lote de imagens**, ou **1 imagem + a mensagem**. |
| Conexão Meta | Login do Facebook para Empresas (token de usuário do sistema), já em produção (`/api/meta/*`). |
| Domínio | `https://donattiturismo.com` (sem www). |
| Ambiente de teste | **Produção mesmo, com cuidado.** Não há banco separado nem conta Meta de teste. |
| Prazo | **Redesenho completo já**, todas as fases em sequência, mesmo com a Black November no ar. |
| Permissões | **Todo mundo faz tudo:** qualquer pessoa logada publica em todos os canais (Google incluso) e cria e edita templates. As travas viram só um aviso ("este elemento é travado no template: alterar mesmo assim?"). |
| Celular | A equipe usa **Android e iPhone**: os dois caminhos de compartilhar no WhatsApp. |
| Identidade da campanha | Manual da Black November: logo, amarelo `#FED400`, preto, faixas de esquenta, preço de varejo, foto do destino em evidência. |

## 6. Como funciona

### 6.1 Arte e template

- **Conjunto de arte da promo (ArtSet):** um documento com os 4 formatos (`StudioDoc` por formato, mesma estrutura de camadas de hoje), mais o template de origem e a foto principal. É o que fica salvo em `designs.data` (o formato `SavedDesignData.formats` atual já comporta isso). Ao abrir uma promo sem arte salva, os 4 formatos são gerados na hora a partir do template padrão.
- **Template:** um conjunto de 4 formatos com variáveis (`{DESTINO}`, `{HOTEL}`, `{VALOR_PARCELA_INT}`...) e propriedades de trava por camada (não mover, não trocar cor, não apagar). Trava é aviso, não bloqueio: qualquer pessoa pode alterar depois de confirmar. Os templates de fábrica são os Modelos Donatti atuais (Destaque, Black November, Clean).
- **Template padrão:** um por campanha. Com a Black November ativa e a oferta marcada como da campanha, o padrão é o Black November; no resto, o padrão escolhido pelo admin.
- **Salvar como template:** grava os 4 formatos juntos. Se alguma camada de texto tem o mesmo conteúdo que o valor de uma variável da promo (ex.: o nome do destino digitado à mão), o Studio avisa e oferece trocar pela variável.
- **O que já está salvo na produção** (decisão minha):
  - Artes de promo salvas com só alguns formatos: o que existe fica como está; os formatos que faltam são gerados com o template de origem da arte (o `family` salvo) ao abrir, e o Studio mostra "gerado agora" na miniatura até alguém olhar.
  - Templates da equipe (`Design kind=template`, um formato só): continuam disponíveis; ao aplicar, o formato salvo entra como está e os outros três vêm do template padrão, com aviso. Na hora de usar, o Studio troca texto fixo igual ao valor de uma variável pela variável (mesma regra do "Salvar como template").
  - Nada é apagado.
- **Templates antigos da tabela `layouts`** (decisão minha, confirmar): convertidos **uma vez** para o formato novo por um script de migração. Story e feed vêm do layout antigo; quadrado e paisagem ficam vazios até alguém completar, e até lá entram como Destaque. O WhatsApp antigo é trocado pelo da variável `{WHATSAPP}`. Depois disso, a tela `/promos/templates` (TemplateManager) e a conversão em tempo real saem do ar.

### 6.2 Studio (uma promo)

Layout (desktop):

- **Barra superior:** voltar, nome da promo, desfazer e refazer, "Salvo", Baixar, **Publicar** (botão principal).
- **Barra de ícones à esquerda:** Templates, Marca, Fotos, Textos, Elementos, IA, Camadas, **Dados da oferta**.
  - **Marca:** logos (Donatti e campanha), cores e fontes do manual, como o "Kit da marca" do Canva.
  - **Dados da oferta:** os campos da promo usados na arte (destino, hotel, datas, noites, parcelas, valor, regime, saída). Editar aqui salva na promo e atualiza os 4 formatos.
- **Centro:** a arte do formato selecionado.
- **Tira embaixo:** as 4 miniaturas sempre visíveis, uma por formato. Clicar troca o formato.

Comportamento:

- Aplicar template: muda os 4 formatos. Se algum formato foi editado à mão, pergunta antes ("Substituir os ajustes do feed e do story?").
- Trocar a foto principal: troca nos 4 formatos.
- Editar uma camada que existe nos 4 formatos (mesmo nome de camada vindo do template): oferece "aplicar nos 4 formatos".
- Salvamento automático continua (4 s após a última mudança), sempre gravando o conjunto inteiro.
- Celular: abas embaixo, como hoje, sem a gaveta cobrindo a arte ao abrir.

### 6.3 Publicar (painel lateral, como o "Compartilhar nas redes" do Adobe Express)

- **Site** vem primeiro e marcado: publicar a promo no site acontece antes dos outros canais, porque o link da oferta (`/pacotes/{slug}`) e o Google dependem disso. Desmarcar só se a pessoa quiser postar sem a oferta no site, e aí o Facebook sai sem o link.
- **Canais** (caixas): Instagram feed, Instagram stories, Facebook feed, Facebook stories, Canal do WhatsApp, Status do WhatsApp, Google (perfil da empresa). Cada canal usa o formato certo: feed 4:5, stories 9:16, Facebook 1:1, Canal do WhatsApp 1:1, Google paisagem.
- **Legenda:** gerada automaticamente (as funções de `promoCaptions.ts`), uma aba por rede (Instagram com "link na bio", Facebook com o link da oferta). É editável e fica salva com a arte.
- **Prévia** do post do canal selecionado.
- **Ação:** "Publicar agora" ou "Agendar" (agendar só no Facebook nesta rodada).
- **Como cada canal publica:**
  - Instagram e Facebook: direto pela conexão da Meta (`/api/meta/publish`).
  - Google: direto pela integração atual.
  - Canal e Status do WhatsApp: não têm API. No Android, um toque abre o compartilhar do sistema com as imagens e a mensagem. No iPhone (que costuma perder o texto ao mandar várias imagens), são dois passos: "Copiar mensagem" e "Compartilhar imagens". No computador, baixa as imagens e copia a mensagem.
  - Google: liberado para qualquer pessoa logada (hoje só admin; a rota `/api/google-business/post` muda).
- **Status por canal:** depois de publicar, o canal mostra ✓, a data e quem publicou. Se depois disso os dados da oferta mudarem, o status mostra "oferta alterada depois do post". Publicar de novo no mesmo canal pede confirmação. O status fica salvo (ver 6.6) e aparece também na lista do `/promos`.
- **Baixar:** um formato, ou os 4 em zip.
- **Concluir:** fecha o Studio e volta para a lista.
- A conexão antiga do Instagram (`/api/instagram/*`, `useInstagram`) deixa de ser usada pelo Studio.

### 6.4 Várias promos

- **Entrada:** na lista do `/promos`, marcar várias promos. Aparece uma barra embaixo, como no ClickUp: "Abrir no Studio", "Publicar no site", "Tirar do site", "Duplicar", "Excluir".
- **"Abrir no Studio" com várias:**
  - O Studio abre no **modo grade**: todas as promos selecionadas, no formato escolhido, como a prévia da "Criação em massa" do Adobe Express.
  - Cada promo usa a arte salva dela; quem não tem arte recebe o template padrão.
  - Seletor no topo: aplicar um template a todas, com aviso para as que têm arte editada.
- **Ajustar uma:** clicar numa promo abre o editor normal; a tira de baixo mostra a fila de promos (com "anterior / próxima") em vez dos formatos, e uma alternância volta para os formatos da promo atual.
- **Publicar todas:** o mesmo painel de 6.3, com uma escolha a mais nos canais de feed:
  - **Uma publicação por promo:** cada uma com a sua legenda.
  - **Carrossel único:** até 10 imagens, legenda em lista. No Facebook é o álbum.
  - Stories sempre um por promo, sem legenda. Canal do WhatsApp com mensagem + lote ou 1 imagem + mensagem.
- **Andamento:** cada promo e canal mostra enviando, ✓ ou erro. Os erros podem ser reenviados individualmente.
- **Fechar com artes não publicadas:** pede confirmação.

### 6.5 Painel `/promos`

- **Topo:** "Para fazer" com contadores clicáveis: promos sem arte, promos com arte e não postadas, promos vencidas no site. Mais ações rápidas: "Nova promo".
- **Lista:** visão em tabela (padrão) e cartões. Colunas: foto, destino e hotel, datas, preço, site (no ar ou rascunho) e **Canais** (ícones dos canais já publicados). Ações por linha: editar dados, abrir no Studio, duplicar, excluir. Seleção múltipla com a barra de 6.4.
- **Duplicar promo:** cria uma cópia (sem a arte publicada e sem o status de canais) e abre o formulário.
- **Configurações** (página nova): campanha Black November (o `BlackFridayPanel` sai do topo), conexão Meta (o `MetaPanel` sai do topo), Google e template padrão. Qualquer pessoa logada vê e usa; conectar ou trocar a conta da Meta e do Google continua exigindo admin (é a conta da empresa).
- **Cadastro:** depois de criar uma promo nova, o Studio abre na sequência (já é assim). O formulário ganha "Salvar e criar outra", que não abre o Studio, para quem cadastra várias seguidas.

### 6.6 Dados novos

- **Registro de publicação:** uma linha por envio, com promo, canal, tipo (post, story, carrossel, álbum, mensagem), id do post na rede (quando houver), quem publicou, quando e status (publicado, agendado, erro). Carrossel e álbum geram uma linha por promo incluída, com o mesmo id de post. Canal e Status do WhatsApp são marcados como "compartilhado" quando a pessoa usa o botão (sem confirmação da rede).
- **Arte:** legenda por rede passa a fazer parte do que é salvo em `designs.data`.
- **Template:** travas por camada no `StudioDoc` (campo opcional, não quebra artes salvas).
- Os campos `instagramPostId` e `googleBusinessPostName` da promo deixam de ser a fonte de verdade (continuam preenchidos por compatibilidade).

## 7. Restrições

- **Sem ambiente de teste:** tudo é testado contra o banco e a conta Meta reais. Por isso:
  - migrações só aditivas, que não quebram o código que está no ar (a migração roda no deploy de produção);
  - nada é apagado de artes e templates existentes;
  - cada fase vai para produção atrás de uma opção ligada por variável de ambiente (Studio novo / Studio atual), até ser conferida;
  - o "Publicar" tem um modo simulação (variável de ambiente) que percorre todo o fluxo e grava o registro como "simulado", sem chamar a Meta nem o Google;
  - o primeiro post real de cada canal é feito pelo João, conferido e apagado na rede se for teste.
- **Campanha no ar:** o "Gerar em lote" atual só sai do ar quando o modo várias promos estiver no ar e conferido.
- Next.js 16 (ler `node_modules/next/dist/docs` antes de mexer em convenções), React, Konva/react-konva no Studio, Prisma e Postgres. **O banco de desenvolvimento da Vercel é o mesmo da produção.**
- Vercel Hobby: funções com até 60 s e corpo de requisição de até 4,5 MB. As imagens sobem uma a uma antes de publicar (já é assim em `useMeta`).
- Meta: carrossel de 2 a 10 imagens. O Instagram não agenda. A imagem precisa estar em URL pública (S3, Supabase ou `/api/media/[id]`).
- Exportação no navegador (`renderDoc`): foto sem CORS quebra a exportação. Hoje existe aviso, e precisa continuar existindo.
- Precisa funcionar no celular (a equipe atende pelo WhatsApp no celular).
- Português correto em toda a interface, com acentos.
- O modelo Black November e as regras do manual da campanha (área segura do story de 250 px em cima e embaixo, foto em evidência) continuam valendo.

## 8. Fica a critério de quem implementar

- Estrutura de componentes, estado do editor (undo e redo para conjunto de formatos), nomes de rotas e tabelas.
- Desenho visual fino dentro do padrão do design system atual (`donatti-ds.css`, Tailwind).
- Como detectar "camada equivalente" entre formatos (sugestão: nome de camada vindo do template).
- Ordem das fases, desde que cada fase entregue um fluxo que funciona de ponta a ponta. Sugestão:
  1. Arte como conjunto de 4 formatos e template único (migrando os de fábrica).
  2. Painel de publicar no Studio com status persistido.
  3. Modo várias promos e barra de ações na lista; remover o "Gerar em lote".
  4. Página de Configurações, topo "Para fazer" e duplicar.
  5. Migração dos templates antigos e saída do TemplateManager.

## 9. Decisões minhas (para o João conferir)

- Site como primeiro canal, marcado por padrão (6.3).
- Artes e templates já salvos: completados ao abrir, nada apagado (6.1).
- Status "oferta alterada depois do post" (6.3).
- Opção por variável de ambiente para alternar Studio novo e atual, e modo simulação do Publicar (7).
- Templates antigos convertidos uma vez e a tela `/promos/templates` aposentada (6.1).
- Leads, painéis legados e importação de várias tarifas por PDF ficam fora desta rodada (3).
- Canal e Status do WhatsApp registrados como "compartilhado" quando a pessoa usa o botão, sem confirmação real (6.6).
- Google entra como canal no painel de publicar, no formato paisagem.
