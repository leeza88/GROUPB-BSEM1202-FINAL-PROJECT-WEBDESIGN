/**
 * app.js - Main Application Entry Point
 * SaloneMedConnect
 * Initializes all modules and global utilities
 */

'use strict';

// ---- Global App Namespace ----
const App = {
  version: '1.0.0',
  name: 'SaloneMedConnect',
  baseUrl: window.location.origin,

  /**
   * Initialize the application
   */
  init() {
    this.initScrollProgress();
    this.initBackToTop();
    this.initSmoothScroll();
    this.initHeroBackground();
    this.initCounterAnimation();
    this.updateActiveNavLink();
    this.initPageTransition();
    console.log(`${this.name} v${this.version} initialized`);
  },

  /**
   * Scroll progress bar at top of page
   */
  initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
  },

  /**
   * Back to top button
   */
  initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  /**
   * Smooth scroll for anchor links
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const offset = 100; // navbar height buffer
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  },

  /**
   * Hero background parallax/zoom on load
   */
  initHeroBackground() {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    // Trigger loaded class for CSS zoom animation
    requestAnimationFrame(() => {
      setTimeout(() => bg.classList.add('loaded'), 100);
    });
  },

  /**
   * Animate counter numbers when in view
   */
  initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const update = () => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString() + suffix;
        if (current < target) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  },

  /**
   * Mark current page nav link as active
   */
  updateActiveNavLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      // Normalize
      const linkPath = href.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
      const isHome = (path === '/' || path.endsWith('index.html')) && (href === '#' || href.includes('index'));
      const isMatch = path.includes(href.split('/').pop().replace('.html', ''));
      link.classList.toggle('active', isHome || (href !== '#' && isMatch && href !== 'index.html'));
    });

    // Highlight home link
    if (path === '/' || path.endsWith('index.html') || path.endsWith('/')) {
      const homeLink = document.querySelector('.nav-link[href*="index"], .nav-link[href="#"]');
      if (homeLink) homeLink.classList.add('active');
    }
  },

  /**
   * Fade-in page on load
   */
  initPageTransition() {
    document.body.classList.add('page-enter');
  },

  /**
   * Utility: debounce
   */
  debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Utility: throttle
   */
  throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Utility: format date
   */
  formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-SL', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'success', duration = 4000) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed; bottom: 5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: 0.875rem 1.25rem;
      border-radius: 12px; display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.875rem; font-weight: 500; max-width: 320px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border-left: 4px solid ${colors[type]};
      animation: fadeInRight 0.3s ease forwards;
    `;
    toast.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]};font-size:1.1rem;flex-shrink:0"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ---- Initialize on DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Export for module use
window.App = App;
