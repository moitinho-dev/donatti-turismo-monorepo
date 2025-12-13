# Deploy do GTM Server-Side na Azure

Este documento descreve o passo a passo para configurar o Google Tag Manager Server-Side na Azure.

## Visão Geral da Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Navegador     │────▶│  GTM Server-Side │────▶│  Google/RD/etc  │
│   (Client)      │     │  (Azure)         │     │  (Endpoints)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │ Subdomínio   │
                        │ gtm.donatti  │
                        │ turismo.com  │
                        └──────────────┘
```

## Pré-requisitos

1. Conta Azure ativa com créditos
2. Acesso ao Google Tag Manager (conta administrador)
3. Domínio configurado (donattiturismo.com)
4. CLI do Azure instalada (`az`)

---

## Parte 1: Configurar Container Server-Side no GTM

### 1.1 Criar Container Server-Side

1. Acesse [tagmanager.google.com](https://tagmanager.google.com)
2. Clique em **Criar Container**
3. Preencha:
   - **Nome**: `Donatti Turismo - Server`
   - **Plataforma**: Selecione **Server**
4. Aceite os termos e clique em **Criar**

### 1.2 Obter Configuração do Container

Após criar, você receberá:
- **Container ID**: Algo como `GTM-XXXXXX` (diferente do client-side)
- **Config URL**: Uma URL para provisionar o servidor

Anote o **Container Config** que será algo como:
```
aW50ZXJuYWwtZ3RtLXNlcnZlci1jb250YWluZXI=
```

---

## Parte 2: Deploy na Azure

### 2.1 Opção A: Deploy via Azure Container Instances (Recomendado)

#### Criar Resource Group

```bash
az login

az group create \
  --name rg-donatti-gtm \
  --location brazilsouth
```

#### Criar Container Instance

```bash
az container create \
  --resource-group rg-donatti-gtm \
  --name gtm-server-donatti \
  --image gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable \
  --cpu 1 \
  --memory 2 \
  --ports 8080 \
  --environment-variables \
    CONTAINER_CONFIG="SEU_CONTAINER_CONFIG_AQUI" \
    PREVIEW_SERVER_URL="https://gtm.donattiturismo.com" \
  --dns-name-label gtm-donatti \
  --restart-policy Always \
  --location brazilsouth
```

#### Obter IP/URL

```bash
az container show \
  --resource-group rg-donatti-gtm \
  --name gtm-server-donatti \
  --query "ipAddress.fqdn" \
  --output tsv
```

### 2.2 Opção B: Deploy via Azure App Service (Mais escalável)

#### Criar App Service Plan

```bash
az appservice plan create \
  --name plan-gtm-donatti \
  --resource-group rg-donatti-gtm \
  --sku B1 \
  --is-linux \
  --location brazilsouth
```

#### Criar Web App com Container

```bash
az webapp create \
  --resource-group rg-donatti-gtm \
  --plan plan-gtm-donatti \
  --name gtm-donatti-server \
  --deployment-container-image-name gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
```

#### Configurar Variáveis de Ambiente

```bash
az webapp config appsettings set \
  --resource-group rg-donatti-gtm \
  --name gtm-donatti-server \
  --settings \
    CONTAINER_CONFIG="SEU_CONTAINER_CONFIG_AQUI" \
    PREVIEW_SERVER_URL="https://gtm.donattiturismo.com" \
    WEBSITES_PORT=8080
```

#### Habilitar Logs

```bash
az webapp log config \
  --resource-group rg-donatti-gtm \
  --name gtm-donatti-server \
  --docker-container-logging filesystem
```

---

## Parte 3: Configurar Domínio Customizado

### 3.1 Criar Subdomínio no DNS

No painel do seu provedor de DNS (Cloudflare, Route53, etc):

| Tipo  | Nome | Valor                                |
|-------|------|--------------------------------------|
| CNAME | gtm  | gtm-donatti-server.azurewebsites.net |

Ou se estiver usando Azure Container Instances:

| Tipo  | Nome | Valor                                        |
|-------|------|----------------------------------------------|
| CNAME | gtm  | gtm-donatti.brazilsouth.azurecontainer.io    |

### 3.2 Configurar SSL/TLS

Para App Service:
```bash
az webapp config hostname add \
  --webapp-name gtm-donatti-server \
  --resource-group rg-donatti-gtm \
  --hostname gtm.donattiturismo.com

az webapp config ssl bind \
  --resource-group rg-donatti-gtm \
  --name gtm-donatti-server \
  --certificate-thumbprint "AUTO" \
  --ssl-type SNI
```

---

## Parte 4: Configurar Tags no GTM Server-Side

### 4.1 Tags Essenciais

#### GA4 Server-Side Tag
1. No container Server, vá em **Tags** > **Nova**
2. Selecione **Google Analytics: GA4**
3. Configure:
   - **Measurement ID**: `G-XXXXXXXX` (seu ID GA4)
   - **Trigger**: All Pages

#### Tag de Conversão RD Station
1. Crie uma **Custom Tag** com o template:
```javascript
const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getEventData = require('getEventData');

const eventName = getEventData('event_name');
const eventData = {
  conversion_identifier: getEventData('conversion_identifier') || eventName,
  email: getEventData('email'),
  name: getEventData('name'),
  personal_phone: getEventData('phone'),
  cf_destination: getEventData('destination'),
  traffic_source: getEventData('traffic_source')
};

// Remover campos vazios
Object.keys(eventData).forEach(key => {
  if (!eventData[key]) delete eventData[key];
});

const url = 'https://api.rd.services/platform/conversions';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer SEU_TOKEN_RDSTATION'
};

sendHttpRequest(url, {
  method: 'POST',
  headers: headers,
  timeout: 5000
}, JSON.stringify(eventData));

data.gtmOnSuccess();
```

### 4.2 Clients Essenciais

1. **GA4 Client**: Para receber hits do GA4
2. **GTM Web Container Client**: Para receber dados do container web

---

## Parte 5: Configurar o Site

### 5.1 Atualizar Variáveis de Ambiente

No `.env.local` ou nas variáveis da Vercel:

```env
NEXT_PUBLIC_GTM_ID="GTM-P3JPBSRM"
NEXT_PUBLIC_GA_ID="G-SEU_ID_GA4"
NEXT_PUBLIC_GTM_SERVER_URL="https://gtm.donattiturismo.com"
```

### 5.2 Variáveis na Vercel

```bash
vercel env add NEXT_PUBLIC_GTM_SERVER_URL production
# Valor: https://gtm.donattiturismo.com
```

---

## Parte 6: Testar a Implementação

### 6.1 Modo Preview

1. No GTM Server-Side, clique em **Preview**
2. Acesse seu site em outra aba
3. Verifique se os eventos estão chegando no painel de preview

### 6.2 Verificar no GA4 DebugView

1. Acesse [analytics.google.com](https://analytics.google.com)
2. Vá em **Admin** > **DebugView**
3. Os eventos devem aparecer em tempo real

### 6.3 Verificar Logs Azure

```bash
az webapp log tail \
  --resource-group rg-donatti-gtm \
  --name gtm-donatti-server
```

---

## Parte 7: Conversões Personalizadas RD Station

### 7.1 Identificadores de Conversão

| Evento no Site         | Identificador RD Station    |
|------------------------|-----------------------------|
| Formulário de contato  | `formulario-contato`        |
| Clique WhatsApp        | `whatsapp-click`            |
| Seleção de pacote      | `selecao-pacote`            |
| Visualização destino   | `visualizacao-destino`      |

### 7.2 Campos Personalizados

Configure no RD Station os campos:
- `cf_destination` - Destino de interesse
- `cf_period` - Período da viagem
- `cf_package_value` - Valor do pacote

---

## Custos Estimados (Azure)

| Recurso                  | SKU    | Custo Mensal (BRL) |
|--------------------------|--------|---------------------|
| Container Instance       | 1 CPU  | ~R$ 150            |
| App Service (B1)         | Basic  | ~R$ 70             |
| App Service (S1)         | Std    | ~R$ 250            |
| Bandwidth (estimado)     | 10GB   | ~R$ 15             |

**Recomendação**: Começar com Container Instance ou App Service B1.

---

## Checklist Final

- [ ] Container Server-Side criado no GTM
- [ ] Container deployado na Azure
- [ ] Domínio customizado configurado (gtm.donattiturismo.com)
- [ ] SSL/TLS configurado
- [ ] GA4 Tag configurada no server
- [ ] RD Station Tag configurada no server
- [ ] Variáveis de ambiente atualizadas no site
- [ ] Testes realizados no modo Preview
- [ ] Container publicado (produção)

---

## Suporte e Troubleshooting

### Erro: Container não inicia
- Verifique se `CONTAINER_CONFIG` está correto
- Cheque os logs: `az container logs --name gtm-server-donatti --resource-group rg-donatti-gtm`

### Erro: Eventos não chegam
- Verifique se o DNS está propagado: `nslookup gtm.donattiturismo.com`
- Confira se o SSL está ativo
- Teste a URL diretamente: `curl https://gtm.donattiturismo.com/healthy`

### Erro: CORS
- O GTM Server-Side já lida com CORS automaticamente
- Se persistir, verifique configurações do Cloudflare/CDN

---

## Referências

- [GTM Server-Side Documentation](https://developers.google.com/tag-platform/tag-manager/server-side)
- [Azure Container Instances](https://docs.microsoft.com/azure/container-instances/)
- [RD Station API](https://developers.rdstation.com/)
