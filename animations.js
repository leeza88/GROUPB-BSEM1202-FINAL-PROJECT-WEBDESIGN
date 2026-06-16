/**
 * animations.js - Scroll Animations, Ripple Effects, UI Enhancements
 * SaloneMedConnect
 */

'use strict';

const AnimationsModule = {
  observer: null,

  init() {
    this.initScrollAnimations();
    this.initRippleEffect();
    this.initFAQ();
    this.initHeroParticles();
    this.loadTestimonials();
    this.loadFAQ();
    this.loadServices();
    this.loadHomeHealthAdvice();
    this.loadHomeVideos();
  },

  /**
   * IntersectionObserver for scroll-triggered animations
   */
  initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements
      document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve after animation to save resources
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    this.observeElements();
  },

  observeElements() {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      if (!el.classList.contains('is-visible')) {
        this.observer?.observe(el);
      }
    });
  },

  /**
   * Button ripple effect
   */
  initRippleEffect() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-ripple');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
      `;

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  },

  /**
   * FAQ accordion
   */
  initFAQ() {
    document.addEventListener('click', (e) => {
      const question = e.target.closest('.faq-question');
      if (!question) return;

      const item = question.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

      // Open clicked (toggle)
      if (!isOpen) item.classList.add('open');
    });

    // Keyboard support for FAQ
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const question = e.target.closest('.faq-question');
      if (!question) return;
      e.preventDefault();
      question.click();
    });
  },

  /**
   * Subtle hero background decorative elements
   */
  initHeroParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    // Handled via CSS decorative elements
  },

  /**
   * Load and render testimonials from JSON
   */
  async loadTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';

    try {
      const res = await fetch(`${base}data/testimonials.json`);
      const testimonials = await res.json();
      this.renderTestimonials(grid, testimonials);
    } catch {
      this.renderTestimonials(grid, this.getFallbackTestimonials());
    }
  },

  renderTestimonials(grid, testimonials) {
    grid.innerHTML = testimonials.slice(0, 3).map((t, i) => `
      <div class="testimonial-card animate-on-scroll fade-up" style="animation-delay:${i * 150}ms">
        <div class="quote-icon" aria-hidden="true"><i class="fas fa-quote-left"></i></div>
        <p class="testimonial-text">${this.sanitize(t.text)}</p>
        <div class="testimonial-author">
          <div class="author-avatar" aria-hidden="true">${t.initials}</div>
          <div class="author-info">
            <strong>${this.sanitize(t.name)}</strong>
            <span>${this.sanitize(t.location)} · ${t.role}</span>
          </div>
        </div>
      </div>
    `).join('');

    this.observeElements();
  },

  /**
   * Load FAQ from JSON
   */
  async loadFAQ() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';

    try {
      const res = await fetch(`${base}data/faq.json`);
      const faqs = await res.json();
      this.renderFAQ(container, faqs.slice(0, 6));
    } catch {
      // FAQ data unavailable - container stays empty
    }
  },

  renderFAQ(container, faqs) {
    container.innerHTML = faqs.map((faq, i) => `
      <div class="faq-item animate-on-scroll fade-up" style="animation-delay:${i * 80}ms">
        <div class="faq-question" tabindex="0" role="button" aria-expanded="false" aria-controls="faq-answer-${faq.id}">
          <h4>${this.sanitize(faq.question)}</h4>
          <span class="faq-icon" aria-hidden="true"><i class="fas fa-plus"></i></span>
        </div>
        <div class="faq-answer" id="faq-answer-${faq.id}" role="region">
          <p>${this.sanitize(faq.answer)}</p>
        </div>
      </div>
    `).join('');

    this.observeElements();
  },

  /**
   * Load services from JSON (if service grid is dynamic)
   */
  async loadServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';

    try {
      const res = await fetch(`${base}data/services.json`);
      const services = await res.json();
      this.renderServices(grid, services.slice(0, 4));
    } catch {
      // Keep static HTML if available
    }
  },

  renderServices(grid, services) {
    // Only render if grid is empty (no static content)
    if (grid.children.length > 0) return;

    grid.innerHTML = services.map((s, i) => `
      <div class="service-card animate-on-scroll fade-up hover-lift" style="animation-delay:${i * 100}ms">
        <div class="service-icon">
          <i class="${s.icon}" aria-hidden="true" style="color:${s.color}"></i>
        </div>
        <h3>${this.sanitize(s.title)}</h3>
        <p>${this.sanitize(s.description)}</p>
        <a href="${s.link}" class="service-link" aria-label="Learn more about ${s.title}">
          Learn More <i class="fas fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
    `).join('');

    this.observeElements();
  },

  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  getFallbackTestimonials() {
    return [
      { id:1, name:"Hawa Kamara",  location:"Freetown",  role:"Patient", initials:"HK", text:"SaloneMedConnect has completely changed how I access healthcare. Booking an appointment with a specialist took only minutes. Highly recommended!" },
      { id:2, name:"James Koroma", location:"Bo",        role:"Patient", initials:"JK", text:"Living in Bo, it was difficult to access specialist doctors in Freetown. SaloneMedConnect bridged that gap perfectly." },
      { id:3, name:"Isatu Sesay",  location:"Makeni",    role:"Patient", initials:"IS", text:"The medicine information feature is incredibly useful. This kind of digital health resource is exactly what Sierra Leone needs." }
    ];
  },

  /* ── Health Advice preview on homepage ─────────── */
  async loadHomeHealthAdvice() {
    const grid = document.getElementById('health-advice-home-grid');
    if (!grid) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';
    const colorMap = {
      'Malaria Prevention': '#dc2626',
      'Maternal Health':    '#e91e8c',
      'Typhoid Prevention': '#7c3aed',
      'Cholera Prevention': '#0a6ebd',
      'HIV/AIDS Awareness': '#dc2626',
      'Child Nutrition':    '#10b981',
      'Mental Health':      '#7c3aed',
      'Diabetes Management':'#f59e0b'
    };

    try {
      const res  = await fetch(`${base}data/health-advice.json`);
      const data = await res.json();
      // Show 4 on homepage
      grid.innerHTML = data.slice(0, 4).map((item, i) => {
        const col = colorMap[item.category] || '#0a6ebd';
        return `
        <div class="advice-preview-card animate-on-scroll fade-up"
          style="animation-delay:${i * 100}ms;display:flex;align-items:flex-start;gap:1rem;background:var(--white);border:1px solid var(--gray-100);border-radius:var(--radius-xl);padding:1.25rem;cursor:pointer;transition:all 0.25s"
          onclick="window.location.href='${base}pages/dashboard.html#health-advice'"
          onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-card)';this.style.borderColor='${col}33'"
          onmouseleave="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--gray-100)'">
          <div style="width:50px;height:50px;border-radius:var(--radius-lg);background:${item.bgColor};display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">
            <i class="${item.icon}" style="color:${col}"></i>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${col};margin-bottom:3px">${this.sanitize(item.category)}</div>
            <h4 style="font-family:'Poppins',sans-serif;font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700);line-height:1.35;margin-bottom:5px">${this.sanitize(item.title)}</h4>
            <p style="font-size:11px;color:var(--gray-400);line-height:1.55">${this.sanitize(item.tips[0])}</p>
          </div>
        </div>`;
      }).join('');
      this.observeElements();
    } catch(e) {
      grid.innerHTML = '';
    }
  },

  /* ── Medical video preview on homepage ─────────── */
  async loadHomeVideos() {
    const grid = document.getElementById('videos-home-grid');
    if (!grid) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';

    try {
      const res  = await fetch(`${base}data/medical-videos.json`);
      const data = await res.json();
      // Show 4 on homepage
      grid.innerHTML = data.slice(0, 4).map((v, i) => `
        <div class="animate-on-scroll fade-up"
          style="animation-delay:${i * 100}ms;background:var(--white);border:1px solid var(--gray-100);border-radius:var(--radius-xl);overflow:hidden;cursor:pointer;transition:all 0.25s"
          onclick="window._openVideoModal && window._openVideoModal('${this.sanitize(v.youtubeId)}','${this.sanitize(v.title)}')"
          onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-card)'"
          onmouseleave="this.style.transform='';this.style.boxShadow=''">
          <div style="position:relative;height:160px;background:#1e293b;overflow:hidden">
            <img src="${this.sanitize(v.thumbnail)}" alt="${this.sanitize(v.title)}" loading="lazy"
              style="width:100%;height:100%;object-fit:cover;opacity:0.82"
              onerror="this.style.display='none'">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.92);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--primary-color);box-shadow:0 4px 16px rgba(0,0,0,0.3)">
                <i class="fas fa-play" style="margin-left:3px"></i>
              </div>
            </div>
            <div style="position:absolute;bottom:0.5rem;right:0.5rem;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:2px 7px;border-radius:4px;font-weight:500">${this.sanitize(v.duration)}</div>
            <div style="position:absolute;top:0.5rem;left:0.5rem;background:var(--primary-color);color:#fff;font-size:9px;padding:2px 8px;border-radius:4px;font-weight:600;text-transform:uppercase">${this.sanitize(v.category)}</div>
          </div>
          <div style="padding:0.875rem">
            <h4 style="font-family:'Poppins',sans-serif;font-size:var(--font-size-sm);font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;line-height:1.4">${this.sanitize(v.title)}</h4>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem">
              <span style="font-size:11px;color:var(--primary-color);font-weight:600">${this.sanitize(v.source)}</span>
              <span style="font-size:11px;color:var(--gray-400)"><i class="fas fa-eye"></i> ${this.sanitize(v.views)}</span>
            </div>
          </div>
        </div>`).join('');
      this.observeElements();
    } catch(e) {
      grid.innerHTML = '';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AnimationsModule.init();
});

window.AnimationsModule = AnimationsModule;
