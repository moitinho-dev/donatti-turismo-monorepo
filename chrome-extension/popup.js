const API_BASE = "https://donattiturismo.com"

const statusEl = document.getElementById("status")
const previewEl = document.getElementById("preview")
const btnExtract = document.getElementById("btn-extract")
const btnSend = document.getElementById("btn-send")

let extractedFields = null

function showStatus(type, message) {
  statusEl.className = `status show ${type}`
  statusEl.innerHTML = message
}

function hideStatus() {
  statusEl.className = "status"
}

function getPackageType() {
  return document.querySelector('input[name="tipo"]:checked')?.value || "duplo"
}

function formatBRL(value) {
  const n = parseFloat(value)
  if (isNaN(n)) return "—"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function showPreview(fields) {
  const rows = []
  if (fields.DESTINO) rows.push(["Destino", fields.DESTINO])
  if (fields.HOTEL) rows.push(["Hotel", fields.HOTEL])
  if (fields.VALOR) {
    const tipo = getPackageType()
    const valor = tipo === "duplo" ? parseFloat(fields.VALOR) / 2 : parseFloat(fields.VALOR)
    rows.push(["Valor (por pessoa)", formatBRL(valor)])
    if (tipo === "duplo") rows.push(["", "⚡ Dividido por 2 (pacote duplo)"])
  }
  if (fields.PARCELAS) rows.push(["Parcelas", `${fields.PARCELAS}x`])
  if (fields.NUMERO_DE_NOITES) rows.push(["Noites", fields.NUMERO_DE_NOITES])
  if (fields.DE && fields.MES_DE) rows.push(["Ida", `${fields.DE}/${fields.MES_DE}/${fields.ANO || ""}`])
  if (fields.ATE && fields.MES_ATE) rows.push(["Volta", `${fields.ATE}/${fields.MES_ATE}/${fields.ANO || ""}`])
  if (fields.regime) rows.push(["Regime", fields.regime.replace(/_/g, " ")])
  if (fields.AEREO) rows.push(["Aéreo", "Sim"])

  previewEl.innerHTML = rows
    .map(([label, value]) => {
      if (!label) return `<div style="padding:2px 0;font-size:11px;color:#ffa200;">${value}</div>`
      return `<div class="preview-row"><span class="preview-label">${label}</span><span class="preview-value">${value}</span></div>`
    })
    .join("")
  previewEl.classList.add("show")
}

// Extract promo from current page
btnExtract.addEventListener("click", async () => {
  extractedFields = null
  btnSend.style.display = "none"
  btnSend.disabled = true
  previewEl.classList.remove("show")
  hideStatus()

  btnExtract.disabled = true
  btnExtract.innerHTML = '<span class="spinner"></span> Extraindo...'

  try {
    // Get page text via content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error("Nenhuma aba ativa encontrada")

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get visible text, ignoring scripts/styles
        const body = document.body.cloneNode(true)
        body.querySelectorAll("script, style, noscript, iframe").forEach(el => el.remove())
        return {
          text: body.innerText?.slice(0, 10000) || "",
          url: window.location.href,
          title: document.title,
        }
      },
    })

    const pageData = results?.[0]?.result
    if (!pageData?.text || pageData.text.length < 20) {
      throw new Error("Não foi possível ler o conteúdo da página")
    }

    showStatus("loading", '<span class="spinner"></span> Analisando com IA...')

    // Send to our API
    const res = await fetch(`${API_BASE}/api/promos/extract-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send auth cookies
      body: JSON.stringify({
        text: pageData.text,
        url: pageData.url,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}`)
    }

    extractedFields = data.fields
    showPreview(extractedFields)

    const filledCount = Object.values(extractedFields).filter(v => v != null).length
    showStatus("success", `✓ ${filledCount} campos extraídos com sucesso`)

    btnSend.style.display = "flex"
    btnSend.disabled = false
  } catch (err) {
    showStatus("error", `✗ ${err.message}`)
  } finally {
    btnExtract.disabled = false
    btnExtract.innerHTML = "Extrair Promo desta Página"
  }
})

// Send extracted data to /promos
btnSend.addEventListener("click", async () => {
  if (!extractedFields) return

  const tipo = getPackageType()
  const fields = { ...extractedFields }

  // Adjust price for package type
  if (fields.VALOR && tipo === "duplo") {
    const val = parseFloat(fields.VALOR)
    if (!isNaN(val)) fields.VALOR = (val / 2).toFixed(2)
  }

  // Encode fields as query params so the PromoForm can read them
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== "") {
      params.set(key, String(value))
    }
  }

  // Open the promos page with pre-filled data
  const url = `${API_BASE}/promos?autofill=${encodeURIComponent(params.toString())}`

  btnSend.disabled = true
  btnSend.innerHTML = '<span class="spinner"></span> Abrindo...'

  chrome.tabs.create({ url })
})

// Update preview when package type changes
document.querySelectorAll('input[name="tipo"]').forEach(input => {
  input.addEventListener("change", () => {
    if (extractedFields) showPreview(extractedFields)
  })
})
