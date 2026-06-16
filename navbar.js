/**
 * navbar.js - Sticky Navigation & Mobile Menu
 * SaloneMedConnect
 */

'use strict';

const Navbar = {
  navbar: null,
  hamburger: null,
  menu: null,
  overlay: null,
  isOpen: false,

  init() {
    this.navbar    = document.querySelector('.navbar');
    this.hamburger = document.querySelector('.hamburger');
    this.menu      = document.querySelector('.navbar-menu');
    this.overlay   = document.querySelector('.mobile-menu-overlay');

    if (!this.navbar) return;

    this.initStickyNav();
    this.initMobileMenu();
    this.initDropdowns();
    this.initKeyboardNav();
  },

  /**
   * Sticky navbar with scroll detection
   */
  initStickyNav() {
    const SCROLL_THRESHOLD = 20;

    const handleScroll = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      this.navbar.classList.toggle('scrolled', scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run on init
  },

  /**
   * Mobile hamburger menu
   */
  initMobileMenu() {
    if (!this.hamburger || !this.menu) return;

    this.hamburger.addEventListener('click', () => this.toggleMenu());

    // Close on overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeMenu());
    }

    // Close on nav link click (mobile)
    this.menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 991) this.closeMenu();
      });
    });

    // Close on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991) this.closeMenu();
    }, { passive: true });
  },

  toggleMenu() {
    this.isOpen ? this.closeMenu() : this.openMenu();
  },

  openMenu() {
    this.isOpen = true;
    this.menu?.classList.add('open');
    this.hamburger?.classList.add('open');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.hamburger?.setAttribute('aria-expanded', 'true');
  },

  closeMenu() {
    this.isOpen = false;
    this.menu?.classList.remove('open');
    this.hamburger?.classList.remove('open');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
    this.hamburger?.setAttribute('aria-expanded', 'false');
  },

  /**
   * Keyboard navigation support
   */
  initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.closeMenu();
    });
  },

  /**
   * Placeholder for dropdown menus (future)
   */
  initDropdowns() {
    // Future: Add dropdown/mega-menu logic here
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
});

window.Navbar = Navbar;
