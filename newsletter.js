/**
 * newsletter.js - Newsletter Subscription
 * SaloneMedConnect
 */

'use strict';

const NewsletterModule = {
  forms: [],

  init() {
    this.forms = document.querySelectorAll('[data-newsletter-form]');
    this.forms.forEach(form => this.setupForm(form));

    // Also handle standalone newsletter containers
    const container = document.querySelector('.newsletter-form');
    if (container && !container.dataset.newsletterForm) {
      this.setupInlineForm(container);
    }
  },

  setupForm(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input    = form.querySelector('input[type="email"]');
      const feedback = form.querySelector('.newsletter-feedback') ||
                       document.querySelector('.newsletter-feedback');
      await this.handleSubmit(input, feedback, form);
    });
  },

  setupInlineForm(container) {
    const btn   = container.querySelector('button[type="submit"], .btn');
    const input = container.querySelector('input[type="email"]');
    const feedback = document.querySelector('.newsletter-feedback');

    if (!btn || !input) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleSubmit(input, feedback, container);
    });

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await this.handleSubmit(input, feedback, container);
      }
    });
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  async handleSubmit(input, feedback, form) {
    if (!input) return;

    const email = input.value.trim();

    // Reset state
    input.classList.remove('error');
    if (feedback) feedback.className = 'newsletter-feedback';

    // Validate
    if (!email) {
      input.classList.add('error');
      if (feedback) {
        feedback.className = 'newsletter-feedback error-nl';
        feedback.textContent = 'Please enter your email address.';
      }
      input.focus();
      return;
    }

    if (!this.validateEmail(email)) {
      input.classList.add('error');
      if (feedback) {
        feedback.className = 'newsletter-feedback error-nl';
        feedback.textContent = 'Please enter a valid email address.';
      }
      input.focus();
      return;
    }

    // Check for duplicates in localStorage
    if (this.isAlreadySubscribed(email)) {
      if (feedback) {
        feedback.className = 'newsletter-feedback success';
        feedback.textContent = '✓ You\'re already subscribed! Thank you.';
      }
      return;
    }

    // Show loading
    const btn = form.querySelector('button');
    const originalHTML = btn?.innerHTML;
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner" style="animation:spin 1s linear infinite"></i>';
      btn.disabled = true;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Save subscription
    this.saveSubscription(email);

    // Success
    input.value = '';
    if (feedback) {
      feedback.className = 'newsletter-feedback success';
      feedback.textContent = '✓ You\'re subscribed! Welcome to SaloneMedConnect health updates.';
    }

    if (window.App) App.showToast('Successfully subscribed to health updates!', 'success');

    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }

    // Reset feedback after 5 seconds
    setTimeout(() => {
      if (feedback) feedback.className = 'newsletter-feedback';
    }, 6000);
  },

  isAlreadySubscribed(email) {
    try {
      const subs = JSON.parse(localStorage.getItem('smk_subscribers') || '[]');
      return subs.some(s => s.email.toLowerCase() === email.toLowerCase());
    } catch { return false; }
  },

  saveSubscription(email) {
    try {
      const subs = JSON.parse(localStorage.getItem('smk_subscribers') || '[]');
      subs.push({ email, subscribedAt: new Date().toISOString() });
      localStorage.setItem('smk_subscribers', JSON.stringify(subs));
    } catch (e) {
      // Unavailable
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NewsletterModule.init();
});

window.NewsletterModule = NewsletterModule;
