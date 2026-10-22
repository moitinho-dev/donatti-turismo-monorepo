'use client'

/**
 * DONATTI TURISMO - Página Black Friday (/black-friday)
 * Ligada, datas e desconto do título vêm do painel de promos (BlackFridayPanel).
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

const WHATSAPP_NUMBER = '5567992167694'
const FALLBACK_IMAGE = '/images/hero-beach.jpg'

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

const faqs = [
  {
    q: 'O desconto é real?',
    a: 'Sim. O preço "de" é o valor praticado antes da campanha e o "por" já tem o desconto aplicado. Não precisa de cupom.',
  },
  {
    q: 'Preciso viajar durante a Black Friday?',
    a: 'Não. Você compra durante a campanha e viaja na data da oferta escolhida, que pode ser meses depois.',
  },
  {
    q: 'Por que as ofertas esgotam?',
    a: 'As tarifas são por lote, com poucos lugares por data. Quando o lote acaba, o preço sobe ou a oferta sai do ar.',
  },
  {
    q: 'Posso parcelar?',
    a: 'Sim. Cada oferta mostra em quantas vezes pode ser parcelada no cartão. Também aceitamos Pix e boleto.',
  },
  {
    q: 'Não moro em Campo Grande nem em São Paulo. Posso comprar?',
    a: 'Pode. As saídas principais são CGR e GRU, mas cotamos outras cidades pelo WhatsApp.',
  },
]

const formatInt = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)

const getParcelas = (promo: PublicPromo) =>
  typeof promo.PARCELAS === 'number' ? promo.PARCELAS : Number.parseInt(String(promo.PARCELAS ?? '10'), 10) || 10

/** Desconto em % entre o "de" e o "por" (0 sem preço "de") */
export const discountOf = (promo: PublicPromo) => {
  const now = getPriceNumber(promo.VALOR)
  const before = promo.VALOR_ORIGINAL ? getPriceNumber(promo.VALOR_ORIGINAL) : 0
  return before > now && now > 0 ? Math.round((1 - now / before) * 100) : 0
}

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
      campaign: 'black_friday',
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
    const source = modalPkg ? 'black_friday_card' : 'black_friday_page'
    const payload = {
      name: modalData.name.trim(),
      phone: modalData.phone.trim(),
      source,
      destino: modalPkg?.DESTINO,
      hotel: modalPkg?.HOTEL,
      promoDetails: modalPkg ? `Black Friday | ${modalPkg.DATA_FORMATADA} | ${modalPkg.VALOR}` : 'Black Friday',
    }
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      trackLead({
        name: payload.name,
        phone: payload.phone,
        email: 'nao-informado@lead.local',
        destination: payload.destino || 'black-friday',
        period: payload.promoDetails,
        source,
      })
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }
    const message = modalPkg
      ? `Olá! Sou ${payload.name}. Quero a oferta Black Friday para ${modalPkg.DESTINO} (${modalPkg.DATA_FORMATADA}) por ${modalPkg.VALOR}. Ainda tem lugar nesse lote?`
      : `Olá! Sou ${payload.name}. Quero as ofertas da Black Friday Donatti.`
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
        body: JSON.stringify({ name: vip.name.trim(), phone: vip.phone.trim(), source: 'black_friday_vip', promoDetails: 'Lista VIP Black Friday' }),
      })
      if (!res.ok) throw new Error('lead_error')
      trackEvent('lead_form_submit', { source: 'black_friday_vip' })
      setVipStatus('success')
      setVip({ name: '', phone: '' })
    } catch {
      setVipStatus('error')
    }
  }

  const legal = `Promoção válida de ${formatCampaignShortDate(settings.startsAt)} a ${formatCampaignShortDate(
    settings.endsAt,
  )} nas ofertas desta página, enquanto durarem os lugares de cada lote. Preços por pessoa.`

  return (
    <div className="dt" style={{ minHeight: '100vh', background: 'var(--dt-bg)', color: 'var(--dt-ink)', fontFamily: 'var(--dt-font-sans)' }}>
      {preview && (
        <div className="bf-preview" role="status">
          Pré-visualização da equipe: a página está {phase === 'encerrada' ? 'encerrada' : 'desligada'} e os clientes não veem.
          Ligue no painel de promos.
        </div>
      )}

      <header style={{ position: 'sticky', top: preview ? 40 : 0, zIndex: 20, background: '#ffffff', borderBottom: '1px solid var(--dt-border)' }}>
        <div className="dt-wrap" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <Link href="/" aria-label="Donatti Turismo, início" style={{ display: 'flex' }}>
            <img src="/images/home/logo-donatti.png" alt="Donatti Turismo" style={{ height: 40, width: 'auto' }} width={140} height={40} />
          </Link>
          <nav className="dt-nav" aria-label="Principal">
            {esquenta && <a href="#vip">Lista VIP</a>}
            <a href="#ofertas">Ofertas Black</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <button type="button" className="dt-btn dt-btn--whatsapp" onClick={() => openLead('header')}>
            <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
            <span className="dt-hide-sm">Falar com especialista</span>
            <span className="sr-only">Falar no WhatsApp</span>
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="bf-hero" aria-labelledby="bf-title">
          <img className="bf-hero__photo" src="/images/home/caribe.jpg" alt="" aria-hidden="true" />
          <div className="bf-hero__fade" aria-hidden="true" />
          <div className="dt-wrap">
            <div className="bf-hero__grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 640 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <h1 id="bf-title" className="bf-logo" style={{ margin: 0 }} aria-label="Black Friday Donatti Turismo">
                    <span className="bf-l1">Black</span>
                    <span className="bf-l2">
                      Fr<span className="bf-pct">%</span>day
                    </span>
                  </h1>
                  <span className="dt-eyebrow" style={{ color: 'var(--dt-brand-yellow)' }}>
                    {esquenta ? `Começa em ${formatCampaignShortDate(settings.startsAt)}` : `Só até ${formatCampaignShortDate(settings.endsAt)}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ font: '800 18px/1 var(--dt-font-sans)', textTransform: 'uppercase', paddingBottom: 18 }}>até</span>
                  <span className="bf-off">
                    {settings.maxDiscount}
                    <span className="bf-pct">%</span>
                    <small>OFF</small>
                  </span>
                </div>
                <p style={{ margin: 0, font: '700 20px/1.3 var(--dt-font-sans)' }}>
                  Pacotes com aéreo + hotel
                  <br />
                  saindo de Campo Grande e São Paulo
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {esquenta ? (
                    <a href="#vip" className="dt-btn dt-btn--lg bf-go" style={{ fontSize: 17 }}>
                      Quero ser avisado
                    </a>
                  ) : (
                    <a href="#ofertas" className="dt-btn dt-btn--lg bf-go" style={{ fontSize: 17 }}>
                      Quero aproveitar
                    </a>
                  )}
                </div>
                <p style={{ margin: 0, font: '400 12px/1.5 var(--dt-font-sans)', color: 'rgba(255,255,255,0.75)' }}>{legal}</p>
              </div>
              {target && <Clock target={target} label={esquenta ? 'As ofertas abrem em' : 'A Black termina em'} />}
            </div>
          </div>
        </section>

        <div className="dt-wrap" style={{ marginTop: -56, position: 'relative', zIndex: 2 }}>
          <div className="bf-trust">
            {trust.map((t) => (
              <div key={t.title}>
                <img src={icon.big(t.icon)} alt="" />
                <div>
                  <p className="dt-trust__title">{t.title}</p>
                  <p className="dt-trust__text">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {esquenta && (
          <section id="vip" aria-labelledby="vip-title" style={{ padding: '72px 0 0', scrollMarginTop: 80 }}>
            <div className="dt-wrap">
              <div className="bf-vip">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span className="dt-eyebrow" style={{ color: 'var(--dt-brand-yellow)' }}>
                    Lista VIP
                  </span>
                  <h2 id="vip-title" className="dt-sec-title" style={{ color: '#ffffff' }}>
                    Receba as ofertas antes de abrir
                  </h2>
                  <p style={{ margin: 0, font: '400 17px/1.6 var(--dt-font-sans)', color: 'rgba(255,255,255,0.85)' }}>
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
                  <button type="submit" className="dt-btn dt-btn--lg bf-go--dark" style={{ gridColumn: '1 / -1' }} disabled={vipStatus === 'sending'}>
                    {vipStatus === 'sending' ? 'Enviando…' : 'Quero entrar na lista VIP'}
                  </button>
                  <div aria-live="polite" style={{ gridColumn: '1 / -1' }}>
                    {vipStatus === 'success' && (
                      <div className="dt-alert dt-alert--success" role="status">
                        <div>
                          <b>Pronto!</b>Você vai receber as ofertas no WhatsApp quando a Black abrir.
                        </div>
                      </div>
                    )}
                    {vipStatus === 'error' && (
                      <div className="dt-alert dt-alert--danger" role="alert">
                        <div>
                          <b>Confira os dados</b>Informe seu nome e um WhatsApp com DDD.
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        <section id="ofertas" aria-labelledby="offers-title" style={{ padding: '72px 0 88px', scrollMarginTop: 80 }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="dt-eyebrow" style={{ color: 'var(--dt-brand-navy)' }}>
                {esquenta ? 'Prévia das ofertas' : 'Ofertas no ar agora'}
              </span>
              <h2 id="offers-title" className="dt-sec-title">
                Pacotes com até <span className="bf-mark">{settings.maxDiscount}% OFF</span>
              </h2>
              <span style={{ font: '500 15px/1.5 var(--dt-font-sans)', color: 'var(--dt-ink-secondary)' }}>
                O desconto já está no preço. Quando o lote acaba, a oferta esgota.
              </span>
            </div>

            {months.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ font: '700 13px/1 var(--dt-font-sans)', color: 'var(--dt-ink-secondary)' }}>Quando você quer viajar?</span>
                <div className="bf-months" role="group" aria-label="Mês da viagem">
                  <button type="button" className="bf-month" aria-pressed={month === 'all'} onClick={() => setMonth('all')}>
                    <b>Qualquer mês</b>
                    <span>
                      {promos.length} oferta{promos.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  {months.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className="bf-month"
                      aria-pressed={month === m.key}
                      onClick={() => {
                        setMonth(m.key)
                        trackEvent('catalog_filter', { campaign: 'black_friday', month: m.key })
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
              <span style={{ font: '700 13px/1 var(--dt-font-sans)', color: 'var(--dt-ink-secondary)' }}>Quanto quer gastar por pessoa?</span>
              <div className="bf-bands" role="group" aria-label="Faixa de preço">
                {priceBands.map((b) => (
                  <button key={b.value} type="button" className="bf-band" aria-pressed={band === b.value} onClick={() => setBand(b.value)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {sections.length > 1 && (
              <div className="bf-bands" role="group" aria-label="Tipo de viagem">
                <button type="button" className="bf-band" aria-pressed={section === 'all'} onClick={() => setSection('all')}>
                  Todos os destinos
                </button>
                {sections.map((s) => (
                  <button key={s} type="button" className="bf-band" aria-pressed={section === s} onClick={() => setSection(s)}>
                    {getSectionLabel(s).replace(/^Pacotes /, '')}
                  </button>
                ))}
              </div>
            )}

            {offers.length === 0 ? (
              <div className="dt-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
                <img src={icon.big('passport-and-tickets')} alt="" style={{ width: 56, height: 56 }} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h3 className="dt-card__title">
                    {promos.length === 0 ? 'As ofertas da Black estão chegando' : 'Nenhuma oferta com esses filtros'}
                  </h3>
                  <p className="dt-card__text">Conte o destino e as datas. A especialista procura a melhor tarifa da Black para você.</p>
                </div>
                <button type="button" className="dt-btn dt-btn--whatsapp" onClick={() => openLead('no_results')}>
                  <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
                  Cotar no WhatsApp
                </button>
              </div>
            ) : (
              <div className="dt-grid-offers">
                {offers.map((pkg) => {
                  const total = getPriceNumber(pkg.VALOR)
                  const before = pkg.VALOR_ORIGINAL ? getPriceNumber(pkg.VALOR_ORIGINAL) : 0
                  const off = discountOf(pkg)
                  const parcelas = getParcelas(pkg)
                  const installment = parcelas > 0 ? total / parcelas : total
                  const nights = Number.parseInt(pkg.NUMERO_DE_NOITES || '0', 10)
                  const regime = getRegimeLabel(pkg)
                  return (
                    <article key={pkg.id} className="dt-offer">
                      <Link href={pkg.SITE_SLUG ? `/pacotes/${pkg.SITE_SLUG}` : '#ofertas'} className="dt-offer__media">
                        <img
                          src={pkg.SITE_IMAGE || FALLBACK_IMAGE}
                          alt={`Foto de ${pkg.DESTINO}`}
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE
                          }}
                        />
                        <div className="dt-offer__tags">{off > 0 ? <span className="bf-tag">-{off}%</span> : <span className="bf-tag">Black Friday</span>}</div>
                        {nights > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              right: 12,
                              bottom: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: 26,
                              padding: '0 10px',
                              borderRadius: 6,
                              background: 'rgba(0,0,0,0.6)',
                              color: '#ffffff',
                              font: '600 12px/1 var(--dt-font-sans)',
                            }}
                          >
                            {nights} noites
                          </span>
                        )}
                      </Link>
                      <div className="dt-offer__body">
                        <span className="dt-offer__where">
                          {pkg.DATA_FORMATADA} · saída {getDepartureCities(pkg).join(' e ')}
                        </span>
                        <h3 className="dt-offer__dest">{pkg.DESTINO}</h3>
                        <div className="dt-offer__meta">
                          {pkg.HOTEL && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('bed')} alt="" />
                              {pkg.HOTEL}
                            </span>
                          )}
                          {regime && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('coffee')} alt="" />
                              {regime}
                            </span>
                          )}
                          {pkg.AEREO && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('airplane-take-off')} alt="" />
                              Aéreo incluso
                            </span>
                          )}
                        </div>
                        {before > total && (
                          <div>
                            <span className="bf-save">Economia de R$ {formatInt(before - total)} por pessoa</span>
                          </div>
                        )}
                        <div className="dt-offer__foot" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                          <div className="dt-price">
                            {before > total ? (
                              <span className="dt-price__from">
                                De <span className="dt-price__old">R$ {formatInt(before)}</span> por pessoa
                              </span>
                            ) : (
                              <span className="dt-price__from">Por pessoa</span>
                            )}
                            <span className="dt-price__value" style={{ fontSize: 28 }}>
                              {parcelas}x {formatBRL(installment)}
                            </span>
                            <span className="dt-price__inst">ou R$ {formatInt(total)} à vista</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <button type="button" className="dt-btn dt-btn--sm bf-go--dark" onClick={() => openLead('package_card', pkg)}>
                              {esquenta ? 'Garantir antes' : 'Garantir oferta'}
                            </button>
                            <button
                              type="button"
                              className="dt-btn dt-btn--outline dt-btn--sm"
                              style={{ borderColor: '#000000' }}
                              onClick={() => openLead('package_card_whatsapp', pkg)}
                            >
                              <img className="dt-ic-sm" src={icon.ui('whatsapp')} alt="" />
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="steps-title" style={{ padding: '88px 0', background: 'var(--dt-surface-muted)', scrollMarginTop: 80 }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="dt-eyebrow">Como garantir sua oferta</span>
              <h2 id="steps-title" className="dt-sec-title">
                Três passos antes do lote acabar
              </h2>
            </div>
            <ol className="dt-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((step, i) => (
                <li key={step.title} className="dt-step" style={{ borderTopColor: '#000000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <img src={icon.big(step.icon)} alt="" style={{ width: 64, height: 64 }} />
                    <span className="dt-step-n" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                  </div>
                  <h3 className="dt-card__title" style={{ fontSize: 20 }}>
                    {step.title}
                  </h3>
                  <p className="dt-card__text" style={{ fontSize: 15 }}>
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="duvidas" aria-labelledby="faq-title" style={{ padding: '96px 0', scrollMarginTop: 80 }}>
          <div className="dt-wrap" style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <h2 id="faq-title" className="dt-sec-title">
              Dúvidas sobre a Black Friday
            </h2>
            <div className="dt-accordion">
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    {f.q}
                    <img className="dt-ic" src={icon.ui('expand-arrow')} alt="" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer role="contentinfo" style={{ background: '#000000', color: 'rgba(255,255,255,0.8)', padding: '48px 0 32px' }}>
        <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <img src="/images/home/selo-donatti.png" alt="Donatti Turismo" style={{ width: 72, height: 72 }} width={72} height={72} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, font: '500 14px/1.4 var(--dt-font-sans)' }}>
              <Link href="/" style={{ color: 'inherit' }}>
                Site Donatti
              </Link>
              <Link href="/pacotes" style={{ color: 'inherit' }}>
                Todos os pacotes
              </Link>
              <a href="tel:+5567992167694" style={{ color: 'inherit' }}>
                WhatsApp (67) 99216-7694
              </a>
            </div>
          </div>
          <p style={{ margin: 0, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)', font: '400 12px/1.5 var(--dt-font-sans)', color: 'rgba(255,255,255,0.65)' }}>
            {legal} Donatti Turismo · CNPJ 41.887.394/0001-29 · Avenida Tamandaré, 8 · Campo Grande/MS.
          </p>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => openLead('floating_button')}
        aria-label="Falar no WhatsApp"
        className="dt-btn dt-btn--whatsapp"
        style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 50, width: 60, height: 60, padding: 0, borderRadius: 9999, boxShadow: 'var(--dt-shadow-xl)' }}
      >
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
                    ? `Deixe nome e WhatsApp. A especialista já recebe que você quer ${modalPkg.DESTINO} na Black.`
                    : 'Deixe nome e WhatsApp. Uma especialista te chama com as ofertas da Black.'}
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
