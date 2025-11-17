/**
 * DONATTI TURISMO - BLACK FRIDAY 2025
 * JavaScript Acessível e Performático
 * Timezone: America/Sao_Paulo
 */

'use strict';

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  // Data de término da Black Friday (ISO 8601 com timezone)
  countdownEndDate: '2025-11-29T23:59:59-03:00',

  // Timezone
  timezone: 'America/Sao_Paulo',

  // Ofertas (normalmente viriam de uma API)
  offers: [
    {
      id: 1,
      title: 'Cancún All Inclusive',
      description: '7 noites com all inclusive, transfer e passeios inclusos',
      category: 'praias',
      image: '/images/cancun',
      priceOld: 6998,
      priceCurrent: 3499,
      discount: 50,
      installments: 12,
      slug: 'cancun-all-inclusive'
    },
    {
      id: 2,
      title: 'Europa: Paris + Londres',
      description: '10 dias visitando as principais atrações, com hospedagem e café da manhã',
      category: 'cidades',
      image: '/images/europa',
      priceOld: 12998,
      priceCurrent: 7999,
      discount: 38,
      installments: 12,
      slug: 'europa-paris-londres'
    },
    {
      id: 3,
      title: 'Patagônia Argentina',
      description: '8 dias de aventura em El Calafate e Ushuaia',
      category: 'montanhas',
      image: '/images/patagonia',
      priceOld: 8998,
      priceCurrent: 5499,
      discount: 39,
      installments: 12,
      slug: 'patagonia-argentina'
    },
    {
      id: 4,
      title: 'Maldivas Exclusivo',
      description: '5 noites em resort overwater com pensão completa',
      category: 'exoticos',
      image: '/images/maldivas',
      priceOld: 18998,
      priceCurrent: 9499,
      discount: 50,
      installments: 12,
      slug: 'maldivas-exclusivo'
    },
    {
      id: 5,
      title: 'Fernando de Noronha',
      description: '6 dias no paraíso brasileiro com mergulho e trilhas',
      category: 'praias',
      image: '/images/noronha',
      priceOld: 5998,
      priceCurrent: 3299,
      discount: 45,
      installments: 12,
      slug: 'fernando-de-noronha'
    },
    {
      id: 6,
      title: 'Machu Picchu',
      description: '7 dias entre Cusco e a cidade perdida dos Incas',
      category: 'montanhas',
      image: '/images/machu-picchu',
      priceOld: 4998,
      priceCurrent: 2799,
      discount: 44,
      installments: 12,
      slug: 'machu-picchu'
    }
  ],

  // Sugestões de busca
  searchSuggestions: [
    'Cancún',
    'Paris',
    'Maldivas',
    'Fernando de Noronha',
    'Patagônia',
    'Machu Picchu',
    'Janeiro 2026',
    'Fevereiro 2026',
    'Praia',
    'Montanha',
    'Europa'
  ]
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Formata valor em reais (pt-BR)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Adiciona zero à esquerda para números < 10
 */
function padZero(num) {
  return String(num).padStart(2, '0');
}

/**
 * Debounce para performance em eventos frequentes
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// CONTADOR ACESSÍVEL
// ============================================

class AccessibleCountdown {
  constructor(endDate, timezone) {
    this.endDate = new Date(endDate);
    this.timezone = timezone;

    // Elementos do DOM
    this.daysEl = document.getElementById('days-value');
    this.hoursEl = document.getElementById('hours-value');
    this.minutesEl = document.getElementById('minutes-value');
    this.secondsEl = document.getElementById('seconds-value');
    this.timerEl = document.getElementById('countdown-timer');

    if (!this.daysEl || !this.hoursEl || !this.minutesEl || !this.secondsEl) {
      console.warn('Elementos do countdown não encontrados');
      return;
    }

    // Iniciar contador
    this.update();
    this.interval = setInterval(() => this.update(), 1000);

    // Anunciar mudanças significativas (a cada minuto) para leitores de tela
    this.lastMinuteAnnounced = -1;
  }

  update() {
    const now = new Date();
    const diff = this.endDate - now;

    // Se já expirou
    if (diff <= 0) {
      this.finish();
      return;
    }

    // Calcular tempo restante
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Atualizar DOM
    this.daysEl.textContent = padZero(days);
    this.hoursEl.textContent = padZero(hours);
    this.minutesEl.textContent = padZero(minutes);
    this.secondsEl.textContent = padZero(seconds);

    // Atualizar aria-label para acessibilidade
    this.daysEl.setAttribute('aria-label', `${days} ${days === 1 ? 'dia' : 'dias'} restantes`);
    this.hoursEl.setAttribute('aria-label', `${hours} ${hours === 1 ? 'hora' : 'horas'} restantes`);
    this.minutesEl.setAttribute('aria-label', `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} restantes`);
    this.secondsEl.setAttribute('aria-label', `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'} restantes`);

    // Anunciar mudança de minuto para leitores de tela (sem poluir)
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    if (totalMinutes !== this.lastMinuteAnnounced) {
      this.lastMinuteAnnounced = totalMinutes;

      // Apenas anunciar em momentos críticos
      if (days === 0 && hours === 0 && minutes <= 10) {
        this.announceToScreenReader(
          `Atenção: restam apenas ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} para o fim da promoção`
        );
      }
    }
  }

  announceToScreenReader(message) {
    // Criar elemento temporário para anúncio
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover após 3 segundos
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  }

  finish() {
    clearInterval(this.interval);

    // Mostrar zeros
    this.daysEl.textContent = '00';
    this.hoursEl.textContent = '00';
    this.minutesEl.textContent = '00';
    this.secondsEl.textContent = '00';

    // Anunciar fim
    this.announceToScreenReader('A promoção de Black Friday chegou ao fim.');

    // Atualizar visual
    if (this.timerEl) {
      this.timerEl.style.opacity = '0.5';
    }
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// ============================================
// FILTRO DE CATEGORIAS
// ============================================

class CategoryFilter {
  constructor() {
    this.activeCategory = null;
    this.categoryButtons = document.querySelectorAll('.category-card');
    this.offersGrid = document.getElementById('offers-grid');

    if (!this.categoryButtons.length || !this.offersGrid) {
      console.warn('Elementos de categoria não encontrados');
      return;
    }

    this.init();
  }

  init() {
    this.categoryButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleCategoryClick(e));

      // Acessibilidade de teclado
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCategoryClick(e);
        }
      });
    });

    // Renderizar ofertas iniciais
    this.renderOffers();
  }

  handleCategoryClick(e) {
    const button = e.currentTarget;
    const category = button.getAttribute('data-category');

    // Toggle categoria
    if (this.activeCategory === category) {
      this.activeCategory = null;
      button.setAttribute('aria-pressed', 'false');
    } else {
      // Desmarcar outros botões
      this.categoryButtons.forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
      });

      this.activeCategory = category;
      button.setAttribute('aria-pressed', 'true');
    }

    // Re-renderizar ofertas
    this.renderOffers();

    // Anunciar para leitores de tela
    const message = this.activeCategory
      ? `Filtrando por ${button.querySelector('.category-card__title').textContent}`
      : 'Mostrando todos os pacotes';

    this.announceToScreenReader(message);
  }

  renderOffers() {
    const filteredOffers = this.activeCategory
      ? CONFIG.offers.filter(offer => offer.category === this.activeCategory)
      : CONFIG.offers;

    // Limpar grid
    this.offersGrid.innerHTML = '';

    // Se não houver ofertas
    if (filteredOffers.length === 0) {
      this.offersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-8);">
          <p style="font-size: var(--font-size-xl); color: var(--text-muted);">
            Nenhum pacote encontrado nesta categoria.
          </p>
        </div>
      `;
      return;
    }

    // Renderizar cards
    filteredOffers.forEach(offer => {
      const card = this.createOfferCard(offer);
      this.offersGrid.appendChild(card);
    });

    // Anunciar quantidade
    const count = filteredOffers.length;
    this.announceToScreenReader(
      `${count} ${count === 1 ? 'pacote encontrado' : 'pacotes encontrados'}`
    );
  }

  createOfferCard(offer) {
    const article = document.createElement('article');
    article.className = 'offer-card';

    const installmentValue = Math.floor(offer.priceCurrent / offer.installments);

    article.innerHTML = `
      <div class="offer-card__image">
        <picture>
          <source srcset="${offer.image}-400w.webp 400w, ${offer.image}-800w.webp 800w" type="image/webp">
          <img
            src="${offer.image}-800w.jpg"
            alt="${offer.title}"
            loading="lazy"
            width="400"
            height="300"
          >
        </picture>
        <span class="offer-card__badge">${offer.discount}% OFF</span>
      </div>
      <div class="offer-card__content">
        <h3 class="offer-card__title">${offer.title}</h3>
        <p class="offer-card__description">${offer.description}</p>
        <div class="offer-card__pricing">
          <span class="offer-card__price-old">De ${formatCurrency(offer.priceOld)}</span>
          <span class="offer-card__price-current">Por ${formatCurrency(offer.priceCurrent)}</span>
          <span class="offer-card__installment">
            ou ${offer.installments}x de ${formatCurrency(installmentValue)} sem juros
          </span>
        </div>
        <a href="/pacotes/${offer.slug}" class="btn btn--primary btn--full">
          Ver detalhes
        </a>
      </div>
    `;

    return article;
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  }
}

// ============================================
// BUSCA COM SUGESTÕES
// ============================================

class SearchWithSuggestions {
  constructor() {
    this.searchInput = document.getElementById('search-input');
    this.searchForm = document.querySelector('.search-form');
    this.suggestionsContainer = document.getElementById('search-suggestions');

    if (!this.searchInput || !this.searchForm) {
      console.warn('Elementos de busca não encontrados');
      return;
    }

    this.init();
  }

  init() {
    // Debounce para performance
    const debouncedSearch = debounce((query) => this.showSuggestions(query), 300);

    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      if (query.length >= 2) {
        debouncedSearch(query);
      } else {
        this.hideSuggestions();
      }
    });

    // Submeter formulário
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSearch(this.searchInput.value.trim());
    });

    // Fechar sugestões ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.searchForm.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    // Navegação por teclado nas sugestões
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && this.suggestionsContainer) {
        e.preventDefault();
        const firstSuggestion = this.suggestionsContainer.querySelector('button');
        if (firstSuggestion) {
          firstSuggestion.focus();
        }
      }
    });
  }

  showSuggestions(query) {
    if (!this.suggestionsContainer) return;

    const queryLower = query.toLowerCase();
    const matches = CONFIG.searchSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(queryLower)
    ).slice(0, 5); // Máximo 5 sugestões

    if (matches.length === 0) {
      this.hideSuggestions();
      return;
    }

    // Criar HTML das sugestões
    const suggestionsHTML = matches.map((suggestion, index) => `
      <button
        type="button"
        class="search-suggestion-item"
        data-suggestion="${suggestion}"
        style="
          display: block;
          width: 100%;
          padding: var(--space-2) var(--space-3);
          text-align: left;
          background: transparent;
          border: none;
          color: var(--text);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        "
        onmouseover="this.style.background='var(--bg-elevated)'"
        onmouseout="this.style.background='transparent'"
        onfocus="this.style.background='var(--bg-elevated)'"
        onblur="this.style.background='transparent'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="display: inline; margin-right: var(--space-2);" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2"/>
        </svg>
        ${suggestion}
      </button>
    `).join('');

    this.suggestionsContainer.innerHTML = suggestionsHTML;
    this.suggestionsContainer.classList.add('search-suggestions--visible');

    // Adicionar event listeners
    const suggestionButtons = this.suggestionsContainer.querySelectorAll('.search-suggestion-item');
    suggestionButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const suggestion = button.getAttribute('data-suggestion');
        this.searchInput.value = suggestion;
        this.hideSuggestions();
        this.handleSearch(suggestion);
      });

      // Navegação por teclado
      button.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && index < suggestionButtons.length - 1) {
          e.preventDefault();
          suggestionButtons[index + 1].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (index > 0) {
            suggestionButtons[index - 1].focus();
          } else {
            this.searchInput.focus();
          }
        } else if (e.key === 'Escape') {
          this.hideSuggestions();
          this.searchInput.focus();
        }
      });
    });
  }

  hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.classList.remove('search-suggestions--visible');
      this.suggestionsContainer.innerHTML = '';
    }
  }

  handleSearch(query) {
    if (!query) return;

    console.log('Buscando por:', query);

    // Aqui você implementaria a lógica real de busca
    // Por exemplo, filtrar ofertas, fazer requisição à API, etc.

    // Anunciar para leitores de tela
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = `Buscando por ${query}`;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 2000);

    // Redirecionar para página de resultados (exemplo)
    // window.location.href = `/busca?q=${encodeURIComponent(query)}`;
  }
}

// ============================================
// SMOOTH SCROLL COM ACESSIBILIDADE
// ============================================

class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    // Interceptar links âncora internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');

        // Ignorar âncoras vazias
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          // Scroll suave
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Focar no elemento (acessibilidade)
          // Adicionar tabindex se não for focável
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }

          target.focus({ preventScroll: true });
        }
      });
    });
  }
}

// ============================================
// LAZY LOADING DE IMAGENS (Fallback)
// ============================================

class LazyLoadImages {
  constructor() {
    // Verificar se o navegador suporta lazy loading nativo
    if ('loading' in HTMLImageElement.prototype) {
      // Navegador suporta, não fazer nada
      return;
    }

    // Fallback para navegadores antigos
    this.images = document.querySelectorAll('img[loading="lazy"]');
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      });

      this.images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback: carregar todas as imagens
      this.images.forEach(img => {
        img.src = img.dataset.src || img.src;
      });
    }
  }
}

// ============================================
// ANALYTICS E TRACKING (Exemplo)
// ============================================

class Analytics {
  static trackEvent(category, action, label, value) {
    // Integração com Google Analytics, Meta Pixel, etc.
    console.log('Analytics Event:', { category, action, label, value });

    // Exemplo Google Analytics 4
    if (typeof gtag === 'function') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  }

  static trackPageView(path) {
    console.log('Analytics PageView:', path);

    if (typeof gtag === 'function') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path
      });
    }
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar contador
  const countdown = new AccessibleCountdown(
    CONFIG.countdownEndDate,
    CONFIG.timezone
  );

  // Inicializar filtro de categorias
  const categoryFilter = new CategoryFilter();

  // Inicializar busca
  const search = new SearchWithSuggestions();

  // Inicializar smooth scroll
  const smoothScroll = new SmoothScroll();

  // Inicializar lazy loading (fallback)
  const lazyLoad = new LazyLoadImages();

  // Track CTA clicks
  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('click', () => {
      Analytics.trackEvent('CTA', 'click', btn.textContent.trim());
    });
  });

  // Track category selection
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      Analytics.trackEvent('Category', 'filter', category);
    });
  });

  console.log('✅ Donatti Turismo - Black Friday 2025 initialized');
});

// ============================================
// PERFORMANCE MONITORING
// ============================================

// Web Vitals (opcional - requer biblioteca web-vitals)
if (typeof PerformanceObserver !== 'undefined') {
  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observer not supported');
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      console.log('CLS Score:', clsScore);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observer not supported');
  }
}

// Exportar para uso global se necessário
window.DonattiTurismo = {
  CONFIG,
  Analytics,
  formatCurrency
};
