'use client'

/**
 * DONATTI TURISMO - Página Black November (/black-november), a Black Friday da Donatti.
 * Ligada, datas e desconto do título vêm do painel de promos (BlackFridayPanel).
 * Identidade: manual da campanha (preto, amarelo #FED400, logo com avião no A e pin no O).
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { trackEvent, trackLead } from '@/lib/analytics'
import { getPriceNumber, getSectionLabel, parsePromoDates } from '@/lib/utils'
import { getDepartureCities, getRegimeLabel, type PublicPromo } from '@/components/home/RealTimePromos'
import {
  formatCampaignShortDate,
  getBlackFridayPhase,
  getCountdownTarget,
  getTimeLeft,
  type BlackFridayPhase,
  type BlackFridaySettings,
} from '@/config/blackFriday'
import { campaignFaqs, discountOf } from '@/lib/campaign'

const WHATSAPP_NUMBER = '5567992167694'
const FALLBACK_IMAGE = '/images/hero-beach.jpg'
const HERO_IMAGE = '/images/home/porto-de-galinhas.jpg'

const icon = {
  ui: (name: string) => `/icons/ui/${name}.png`,
  big: (name: string) => `/icons/destaque/${name}.png`,
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const priceBands = [
  { value: 'all', label: 'Todos', test: () => true },
  { value: 'ate-3000', label: 'Até R$ 3.000', test: (v: number) => v <= 3000 },
  { value: '3000-5000', label: 'R$ 3.000 a 5.000', test: (v: number) => v > 3000 && v <= 5000 },
  { value: '5000-8000', label: 'R$ 5.000 a 8.000', test: (v: number) => v > 5000 && v <= 8000 },
  { value: '8000+', label: 'Acima de R$ 8.000', test: (v: number) => v > 8000 },
]

const trust = [
  { icon: 'customer-support', title: 'Atendimento humano', text: 'Especialista no WhatsApp, antes e durante a viagem.' },
  { icon: 'bank-card-front-side', title: 'Parcele no cartão', text: 'Pix e boleto também.' },
  { icon: 'shield', title: 'Desconto de verdade', text: 'O "de" é o preço praticado antes da Black.' },
  { icon: 'airplane-take-off', title: 'Saídas CGR e GRU', text: 'Outras cidades sob consulta.' },
]

const steps = [
  { icon: 'search', title: 'Escolha a oferta', description: 'Filtre por mês da viagem, preço ou tipo de destino.' },
  { icon: 'chat', title: 'Garanta no WhatsApp', description: 'A especialista confirma a data e segura a tarifa do lote atual.' },
  { icon: 'luggage', title: 'Parcele e viaje', description: 'Fechamos a reserva com você e acompanhamos até a volta.' },
]

const formatInt = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)

const getParcelas = (promo: PublicPromo) =>
  typeof promo.PARCELAS === 'number' ? promo.PARCELAS : Number.parseInt(String(promo.PARCELAS ?? '10'), 10) || 10

const monthKey = (promo: PublicPromo) => {
  const { start } = parsePromoDates(promo.DATA_FORMATADA)
  return start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}` : null
}

const pad = (n: number) => String(n).padStart(2, '0')

function Clock({ target, label }: { target: Date; label: string }) {
  // Só calcula no cliente para não divergir do HTML do servidor
  const [left, setLeft] = useState<ReturnType<typeof getTimeLeft> | null>(null)
  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(target))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  const units = [
    { label: 'dias', value: left?.days },
    { label: 'horas', value: left?.hours },
    { label: 'min', value: left?.minutes },
    { label: 'seg', value: left?.seconds },
  ]
  return (
    <div className="bf-clock" role="timer" aria-label={label}>
      <span className="bf-clock__label">{label}</span>
      <div className="bf-clock__units">
        {units.map((u) => (
          <div key={u.label} className="bf-clock__unit">
            <b>{u.value === undefined ? '--' : pad(u.value)}</b>
            <span>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface BlackFridayLandingProps {
  settings: BlackFridaySettings
  /** Promos da campanha (ver getBlackFridayPromos) */
  promos: PublicPromo[]
  /** Visualização da equipe com a página desligada */
  preview?: boolean
}

export default function BlackFridayLanding({ settings, promos, preview = false }: BlackFridayLandingProps) {
  // A fase vem do servidor e é recalculada no navegador quando a contagem zera
  const [phase, setPhase] = useState<BlackFridayPhase>(() => getBlackFridayPhase(settings))
  useEffect(() => {
    const id = window.setInterval(() => setPhase(getBlackFridayPhase(settings)), 15_000)
    return () => window.clearInterval(id)
  }, [settings])

  const target = useMemo(() => getCountdownTarget(settings, phase), [settings, phase])
  const esquenta = phase === 'esquenta'

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const [month, setMonth] = useState('all')
  const [band, setBand] = useState('all')
  const [section, setSection] = useState('all')

  const months = useMemo(() => {
    const counts = new Map<string, number>()
    promos.forEach((p) => {
      const key = monthKey(p)
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const [y, m] = key.split('-').map(Number)
        return { key, label: `${MONTHS[m - 1]} ${y}`, count }
      })
  }, [promos])

  const sections = useMemo(
    () => Array.from(new Set(promos.map((p) => p.SITE_SECTION).filter(Boolean))) as string[],
    [promos],
  )

  const offers = useMemo(() => {
    const bandTest = priceBands.find((b) => b.value === band)?.test ?? (() => true)
    return promos
      .filter((p) => month === 'all' || monthKey(p) === month)
      .filter((p) => section === 'all' || p.SITE_SECTION === section)
      .filter((p) => bandTest(getPriceNumber(p.VALOR)))
      .sort((a, b) => discountOf(b) - discountOf(a))
  }, [promos, month, band, section])

  // Lead (modal → WhatsApp)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPkg, setModalPkg] = useState<PublicPromo | null>(null)
  const [modalData, setModalData] = useState({ name: '', phone: '' })
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSending, setModalSending] = useState(false)

  // Lista VIP do esquenta
  const [vip, setVip] = useState({ name: '', phone: '' })
  const [vipStatus, setVipStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const openLead = (location: string, pkg: PublicPromo | null = null) => {
    setModalPkg(pkg)
    setModalError(null)
    setModalOpen(true)
    trackEvent(pkg ? 'cta_click' : 'whatsapp_click', {
      location,
      campaign: 'black_november',
      package_slug: pkg?.SITE_SLUG || undefined,
      destination: pkg?.DESTINO,
    })
  }

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!modalData.name.trim() || modalData.phone.replace(/\D/g, '').length < 10) {
      setModalError('Informe seu nome e um WhatsApp com DDD.')
      return
    }
    setModalSending(true)
    setModalError(null)
    const source = modalPkg ? 'black_november_card' : 'black_november_page'
    const payload = {
      name: modalData.name.trim(),
      phone: modalData.phone.trim(),
      source,
      destino: modalPkg?.DESTINO,
      hotel: modalPkg?.HOTEL,
      promoDetails: modalPkg ? `Black November | ${modalPkg.DATA_FORMATADA} | ${modalPkg.VALOR}` : 'Black November',
    }
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      trackLead({
        name: payload.name,
        phone: payload.phone,
        email: 'nao-informado@lead.local',
        destination: payload.destino || 'black-november',
        period: payload.promoDetails,
        source,
      })
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }
    const message = modalPkg
      ? `Olá! Sou ${payload.name}. Quero a oferta da Black November para ${modalPkg.DESTINO} (${modalPkg.DATA_FORMATADA}) por ${formatBRL(getPriceNumber(modalPkg.VALOR))}. Ainda tem lugar nesse lote?`
      : `Olá! Sou ${payload.name}. Quero as ofertas da Black November Donatti.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setModalSending(false)
    setModalOpen(false)
    setModalPkg(null)
    setModalData({ name: '', phone: '' })
  }

  const handleVipSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!vip.name.trim() || vip.phone.replace(/\D/g, '').length < 10) {
      setVipStatus('error')
      return
    }
    setVipStatus('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vip.name.trim(), phone: vip.phone.trim(), source: 'black_november_vip', promoDetails: 'Lista VIP Black November' }),
      })
      if (!res.ok) throw new Error('lead_error')
      trackEvent('lead_form_submit', { source: 'black_november_vip' })
      setVipStatus('success')
      setVip({ name: '', phone: '' })
    } catch {
      setVipStatus('error')
    }
  }

  const legal = `Promoção válida de ${formatCampaignShortDate(settings.startsAt)} a ${formatCampaignShortDate(
    settings.endsAt,
  )} nas ofertas desta página, enquanto durarem os lugares de cada lote. Preços por pessoa.`

  const tapes = esquenta ? ['Esquenta Black November', 'Só na Donatti'] : ['Black November no ar', 'Ofertas o mês inteiro']

  return (
    <div className="dt bn">
      {preview && (
        <div className="bf-preview" role="status">
          Pré-visualização da equipe: a página está {phase === 'encerrada' ? 'encerrada' : 'desligada'} e os clientes não veem.
          Ligue no painel de promos.
        </div>
      )}

      <header className="bn-header" style={{ top: preview ? 40 : 0 }}>
        <div className="dt-wrap bn-header__bar">
          <Link href="/" aria-label="Donatti Turismo, início" style={{ display: 'flex' }}>
            <img src="/images/black-november/donatti-negativo-black.svg" alt="Donatti Turismo" width={132} height={38} style={{ height: 38, width: 'auto' }} />
          </Link>
          <nav className="dt-nav bn-nav" aria-label="Principal">
            {esquenta && <a href="#vip">Lista VIP</a>}
            <a href="#ofertas">Ofertas</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <button type="button" className="dt-btn bn-btn" onClick={() => openLead('header')}>
            <img className="dt-ic bn-ic--dark" src={icon.ui('whatsapp')} alt="" />
            <span className="dt-hide-sm">Falar com especialista</span>
            <span className="sr-only">Falar no WhatsApp</span>
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="bn-hero" aria-labelledby="bn-title">
          <img className="bn-hero__photo" src={HERO_IMAGE} alt="Igrejinha de São Benedito na praia de Porto de Galinhas" fetchPriority="high" />
          <div className="bn-hero__shade" aria-hidden="true" />
          <div className="bn-tapes" aria-hidden="true">
            {tapes.map((label, i) => (
              <div key={label} className={`bn-tape bn-tape--${i + 1}`}>
                <span>{Array.from({ length: 8 }, () => label).join('   •   ')}</span>
              </div>
            ))}
          </div>
          <div className="dt-wrap bn-hero__grid">
            <div className="bn-hero__copy">
              <h1 id="bn-title" className="bn-logo">
                <img src="/images/black-november/logo-black-november.svg" alt="" width={520} height={250} />
                <span className="sr-only">Black November Donatti Turismo: Black Friday de viagens</span>
              </h1>
              <p className="bn-hero__date">
                {esquenta ? `Começa em ${formatCampaignShortDate(settings.startsAt)}` : `Só até ${formatCampaignShortDate(settings.endsAt)}`}
              </p>
              <p className="bn-hero__off">
                <span className="bn-hero__ate">até</span>
                <b>{settings.maxDiscount}%</b>
                <span className="bn-hero__offtag">OFF</span>
              </p>
              <p className="bn-hero__lead">Pacotes com aéreo + hotel saindo de Campo Grande e São Paulo, parcelados no cartão.</p>
              <div className="bn-hero__ctas">
                <a href={esquenta ? '#vip' : '#ofertas'} className="dt-btn dt-btn--lg bn-btn">
                  {esquenta ? 'Quero ser avisado' : 'Ver as ofertas'}
                </a>
                <button type="button" className="dt-btn dt-btn--lg bn-btn--ghost" onClick={() => openLead('hero')}>
                  <img className="dt-ic bn-ic--light" src={icon.ui('whatsapp')} alt="" />
                  Falar no WhatsApp
                </button>
              </div>
            </div>
            {target && <Clock target={target} label={esquenta ? 'As ofertas abrem em' : 'A Black termina em'} />}
          </div>
          <p className="dt-wrap bn-hero__legal">{legal}</p>
        </section>

        <div className="dt-wrap bn-trust">
          {trust.map((t) => (
            <div key={t.title}>
              <span className="bn-trust__ic">
                <img src={icon.big(t.icon)} alt="" />
              </span>
              <div>
                <p className="bn-trust__title">{t.title}</p>
                <p className="bn-trust__text">{t.text}</p>
              </div>
            </div>
          ))}
        </div>

        {esquenta && (
          <section id="vip" aria-labelledby="vip-title" className="bn-section" style={{ paddingBottom: 0 }}>
            <div className="dt-wrap">
              <div className="bn-vip">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span className="bn-kicker bn-kicker--dark">Lista VIP</span>
                  <h2 id="vip-title" className="bn-title bn-title--dark">
                    Receba as ofertas antes de abrir
                  </h2>
                  <p style={{ margin: 0, font: '500 17px/1.55 var(--dt-font-sans)' }}>
                    Os primeiros lotes têm poucos lugares. Deixe seu WhatsApp e a gente avisa assim que a Black começar.
                  </p>
                </div>
                <form onSubmit={handleVipSubmit} noValidate>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="vip-name">
                      Seu nome
                    </label>
                    <input className="dt-input" id="vip-name" autoComplete="name" value={vip.name} onChange={(e) => setVip({ ...vip, name: e.target.value })} />
                  </div>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="vip-phone">
                      WhatsApp com DDD
                    </label>
                    <input
                      className="dt-input"
                      id="vip-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(67) 9 0000-0000"
                      value={vip.phone}
                      onChange={(e) => setVip({ ...vip, phone: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="dt-btn dt-btn--lg bn-btn--black" style={{ gridColumn: '1 / -1' }} disabled={vipStatus === 'sending'}>
                    {vipStatus === 'sending' ? 'Enviando…' : 'Quero entrar na lista VIP'}
                  </button>
                  <div aria-live="polite" style={{ gridColumn: '1 / -1' }}>
                    {vipStatus === 'success' && (
                      <div className="dt-alert dt-alert--success" role="status">
                        <div>
                          <b>Pronto!</b> Você vai receber as ofertas no WhatsApp quando a Black abrir.
                        </div>
                      </div>
                    )}
                    {vipStatus === 'error' && (
                      <div className="dt-alert dt-alert--danger" role="alert">
                        <div>
                          <b>Confira os dados</b> Informe seu nome e um WhatsApp com DDD.
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        <section id="ofertas" aria-labelledby="offers-title" className="bn-section">
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="bn-kicker">{esquenta ? 'Prévia das ofertas' : 'Ofertas no ar agora'}</span>
              <h2 id="offers-title" className="bn-title">
                Pacotes com até <span className="bn-mark">{settings.maxDiscount}% OFF</span>
              </h2>
              <p className="bn-sub">O desconto já está no preço. Quando o lote acaba, a oferta esgota.</p>
            </div>

            {months.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="bn-filter-label">Quando você quer viajar?</span>
                <div className="bf-months" role="group" aria-label="Mês da viagem">
                  <button type="button" className="bn-month" aria-pressed={month === 'all'} onClick={() => setMonth('all')}>
                    <b>Qualquer mês</b>
                    <span>
                      {promos.length} oferta{promos.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  {months.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className="bn-month"
                      aria-pressed={month === m.key}
                      onClick={() => {
                        setMonth(m.key)
                        trackEvent('catalog_filter', { campaign: 'black_november', month: m.key })
                      }}
                    >
                      <b>{m.label}</b>
                      <span>
                        {m.count} oferta{m.count === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <span className="bn-filter-label">Quanto quer gastar por pessoa?</span>
              <div className="bf-bands" role="group" aria-label="Faixa de preço">
                {priceBands.map((b) => (
                  <button key={b.value} type="button" className="bn-band" aria-pressed={band === b.value} onClick={() => setBand(b.value)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {sections.length > 1 && (
              <div className="bf-bands" role="group" aria-label="Tipo de viagem">
                <button type="button" className="bn-band" aria-pressed={section === 'all'} onClick={() => setSection('all')}>
                  Todos os destinos
                </button>
                {sections.map((s) => (
                  <button key={s} type="button" className="bn-band" aria-pressed={section === s} onClick={() => setSection(s)}>
                    {getSectionLabel(s).replace(/^Pacotes /, '')}
                  </button>
                ))}
              </div>
            )}

            {offers.length === 0 ? (
              <div className="bn-empty">
                <img src={icon.big('passport-and-tickets')} alt="" style={{ width: 56, height: 56 }} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h3>{promos.length === 0 ? 'As ofertas da Black estão chegando' : 'Nenhuma oferta com esses filtros'}</h3>
                  <p>Conte o destino e as datas. A especialista procura a melhor tarifa da Black para você.</p>
                </div>
                <button type="button" className="dt-btn bn-btn" onClick={() => openLead('no_results')}>
                  <img className="dt-ic bn-ic--dark" src={icon.ui('whatsapp')} alt="" />
                  Cotar no WhatsApp
                </button>
              </div>
            ) : (
              <div className="dt-grid-offers">
                {offers.map((pkg) => (
                  <OfferCard key={pkg.id} pkg={pkg} esquenta={esquenta} onLead={openLead} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="steps-title" className="bn-section bn-section--alt">
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="bn-kicker">Como garantir sua oferta</span>
              <h2 id="steps-title" className="bn-title">
                Três passos antes do lote acabar
              </h2>
            </div>
            <ol className="dt-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((step, i) => (
                <li key={step.title} className="bn-step">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="bn-trust__ic" style={{ width: 64, height: 64 }}>
                      <img src={icon.big(step.icon)} alt="" style={{ width: 44, height: 44 }} />
                    </span>
                    <span className="bn-step__n" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="duvidas" aria-labelledby="faq-title" className="bn-section">
          <div className="dt-wrap" style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="bn-kicker">Dúvidas</span>
              <h2 id="faq-title" className="bn-title">
                Perguntas sobre a Black November
              </h2>
            </div>
            <div className="bn-accordion">
              {campaignFaqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    {f.q}
                    <img className="dt-ic bn-ic--light" src={icon.ui('expand-arrow')} alt="" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bn-cta" aria-label="Falar com a Donatti">
          <div className="dt-wrap bn-cta__bar">
            <p>Garanta o seu no WhatsApp</p>
            <button type="button" className="dt-btn dt-btn--lg bn-btn--black" onClick={() => openLead('footer_band')}>
              <img className="dt-ic bn-ic--light" src={icon.ui('whatsapp')} alt="" />
              (67) 99216-7694
            </button>
          </div>
        </section>
      </main>

      <footer role="contentinfo" className="bn-footer">
        <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <img src="/images/black-november/donatti-negativo-black.svg" alt="Donatti Turismo" width={160} height={46} style={{ height: 46, width: 'auto' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, font: '500 14px/1.4 var(--dt-font-sans)' }}>
              <Link href="/">Site Donatti</Link>
              <Link href="/pacotes">Todos os pacotes</Link>
              <Link href="/destinos">Destinos</Link>
              <a href="tel:+5567992167694">WhatsApp (67) 99216-7694</a>
            </div>
          </div>
          <p className="bn-footer__legal">
            {legal} Donatti Turismo · CNPJ 41.887.394/0001-29 · Avenida Tamandaré, 8 · Vila Planalto · Campo Grande/MS.
          </p>
        </div>
      </footer>

      <button type="button" onClick={() => openLead('floating_button')} aria-label="Falar no WhatsApp" className="dt-btn bn-fab">
        <img src={icon.ui('whatsapp')} alt="" style={{ width: 28, height: 28 }} />
      </button>

      {modalOpen &&
        isMounted &&
        createPortal(
          <div className="dt" style={{ position: 'fixed', inset: 0, zIndex: 11000 }}>
            <div className="dt-dialog-scrim" style={{ position: 'absolute', inset: 0 }} onClick={() => setModalOpen(false)}>
              <div
                className="dt-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bf-lead-title"
                style={{ position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="dt-btn dt-btn--ghost dt-btn--sm"
                  aria-label="Fechar"
                  onClick={() => setModalOpen(false)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 36, padding: 0 }}
                >
                  <img className="dt-ic" src={icon.ui('multiply')} alt="" />
                </button>
                <img src={icon.big('whatsapp')} alt="" style={{ width: 56, height: 56, marginBottom: 12 }} />
                <h2 className="dt-dialog__title" id="bf-lead-title">
                  Garanta sua oferta
                </h2>
                <p className="dt-dialog__text">
                  {modalPkg
                    ? `Deixe nome e WhatsApp. A especialista já recebe que você quer ${modalPkg.DESTINO} na Black November.`
                    : 'Deixe nome e WhatsApp. Uma especialista te chama com as ofertas da Black November.'}
                </p>
                <form className="dt-stack" style={{ gap: 12 }} onSubmit={handleModalSubmit}>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="bf-l-name">
                      Seu nome
                    </label>
                    <input
                      className="dt-input"
                      id="bf-l-name"
                      autoComplete="name"
                      value={modalData.name}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                    />
                  </div>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="bf-l-phone">
                      WhatsApp com DDD
                    </label>
                    <input
                      className={`dt-input${modalError ? ' dt-input--invalid' : ''}`}
                      id="bf-l-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(67) 9 0000-0000"
                      aria-invalid={!!modalError}
                      aria-describedby={modalError ? 'bf-l-error' : undefined}
                      value={modalData.phone}
                      onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                    />
                    {modalError && (
                      <span className="dt-field__error" id="bf-l-error">
                        {modalError}
                      </span>
                    )}
                  </div>
                  <button type="submit" className="dt-btn dt-btn--whatsapp dt-btn--block dt-btn--lg" disabled={modalSending}>
                    <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
                    {modalSending ? 'Abrindo…' : 'Continuar no WhatsApp'}
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

/** Preço de varejo: parcela grande com os centavos em cima, como nas peças da campanha */
function RetailPrice({ parcelas, installment, total, before }: { parcelas: number; installment: number; total: number; before: number }) {
  const [int, cents] = formatBRL(installment).replace(/^R\$\s?/, '').split(',')
  return (
    <div className="bn-price">
      <span className="bn-price__from">{before > total ? <>De <s>R$ {formatInt(before)}</s> por</> : 'A partir de'}</span>
      <div className="bn-price__row" aria-label={`${parcelas} vezes de ${formatBRL(installment)}`}>
        <span className="bn-price__side">
          <b>{parcelas}x</b>
          <span>R$</span>
        </span>
        <span className="bn-price__int">{int}</span>
        <span className="bn-price__cents">,{cents}</span>
      </div>
      <span className="bn-price__total">Por pessoa · ou R$ {formatInt(total)} à vista</span>
    </div>
  )
}

function OfferCard({ pkg, esquenta, onLead }: { pkg: PublicPromo; esquenta: boolean; onLead: (location: string, pkg?: PublicPromo | null) => void }) {
  const total = getPriceNumber(pkg.VALOR)
  const before = pkg.VALOR_ORIGINAL ? getPriceNumber(pkg.VALOR_ORIGINAL) : 0
  const off = discountOf(pkg)
  const parcelas = getParcelas(pkg)
  const installment = parcelas > 0 ? total / parcelas : total
  const nights = Number.parseInt(pkg.NUMERO_DE_NOITES || '0', 10)
  const regime = getRegimeLabel(pkg)
  return (
    <article className="bn-offer">
      <Link href={pkg.SITE_SLUG ? `/pacotes/${pkg.SITE_SLUG}` : '#ofertas'} className="bn-offer__media">
        <img
          src={pkg.SITE_IMAGE || FALLBACK_IMAGE}
          alt={`Foto de ${pkg.DESTINO}`}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
        <span className="bn-offer__tag">{off > 0 ? `-${off}%` : 'Black November'}</span>
        {nights > 0 && <span className="bn-offer__nights">{nights} noites</span>}
      </Link>
      <div className="bn-offer__body">
        <span className="bn-offer__pill">{pkg.DESTINO}</span>
        <h3 className="bn-offer__hotel">{pkg.HOTEL || pkg.DESTINO}</h3>
        <span className="bn-offer__when">
          {pkg.DATA_FORMATADA} · saída {getDepartureCities(pkg).join(' e ')}
        </span>
        <ul className="bn-offer__inc">
          {pkg.AEREO && (
            <li>
              <img className="bn-ic--light" src={icon.ui('airplane-take-off')} alt="" />
              Aéreo
            </li>
          )}
          {regime && (
            <li>
              <img className="bn-ic--light" src={icon.ui('coffee')} alt="" />
              {regime}
            </li>
          )}
          {pkg.HOTEL && (
            <li>
              <img className="bn-ic--light" src={icon.ui('bed')} alt="" />
              Hotel
            </li>
          )}
        </ul>
        {before > total && <span className="bn-save">Economia de R$ {formatInt(before - total)} por pessoa</span>}
        <RetailPrice parcelas={parcelas} installment={installment} total={total} before={before} />
        <div className="bn-offer__ctas">
          <button type="button" className="dt-btn dt-btn--sm bn-btn" onClick={() => onLead('package_card', pkg)}>
            {esquenta ? 'Garantir antes' : 'Garantir oferta'}
          </button>
          <button type="button" className="dt-btn dt-btn--sm bn-btn--ghost" onClick={() => onLead('package_card_whatsapp', pkg)}>
            <img className="dt-ic-sm bn-ic--light" src={icon.ui('whatsapp')} alt="" />
            WhatsApp
          </button>
        </div>
      </div>
    </article>
  )
}
