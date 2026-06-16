/**
 * doctors.js — Load, render, and filter doctor profiles
 * SaloneMedConnect
 * Supports: real photo URLs, category badges, category filter, skeleton loaders
 */

'use strict';

const DoctorsModule = {
  container:   null,
  doctors:     [],
  maxDisplay:  8,
  activeCategory: '',

  /* ── Category → badge config ─────────────────── */
  categoryConfig: {
    "Women's Health":    { cls: 'badge-womens',   icon: 'fas fa-venus',         color: '#c2185b' },
    'Cardiology':        { cls: 'badge-cardio',   icon: 'fas fa-heart-pulse',   color: '#b91c1c' },
    'Pediatrics':        { cls: 'badge-pediatric',icon: 'fas fa-baby',          color: '#1d4ed8' },
    'Surgery':           { cls: 'badge-surgery',  icon: 'fas fa-user-doctor',   color: '#5b21b6' },
    'Mental Health':     { cls: 'badge-mental',   icon: 'fas fa-brain',         color: '#4c1d95' },
    'Public Health':     { cls: 'badge-public',   icon: 'fas fa-globe',         color: '#065f46' },
    'Infectious Disease':{ cls: 'badge-infect',   icon: 'fas fa-virus',         color: '#92400e' },
    'Neurology':         { cls: 'badge-default',  icon: 'fas fa-brain',         color: '#0a6ebd' },
    'Dermatology':       { cls: 'badge-default',  icon: 'fas fa-hand-holding-medical', color: '#0a6ebd' },
    'Eye Health':        { cls: 'badge-default',  icon: 'fas fa-eye',           color: '#0a6ebd' },
    'Reproductive Health & Safe Abortion Care':
                         { cls: 'badge-womens',   icon: 'fas fa-shield-heart',  color: '#c2185b' }
  },

  /* ── Init ─────────────────────────────────────── */
  init() {
    this.container = document.getElementById('doctors-grid');
    if (!this.container) return;
    this.loadDoctors();
  },

  async loadDoctors() {
    this.showSkeletons();
    const base = this.resolveBasePath();

    try {
      const res = await fetch(`${base}data/doctors.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.doctors = await res.json();
    } catch (err) {
      console.warn('Falling back to embedded doctor data.', err.message);
      this.doctors = this.getFallbackDoctors();
    }

    this.renderDoctors(this.filtered());
  },

  filtered() {
    if (!this.activeCategory) return this.doctors.slice(0, this.maxDisplay);
    return this.doctors
      .filter(d => d.category === this.activeCategory)
      .slice(0, this.maxDisplay);
  },

  /* ── Category filter (called from HTML onclick) ─ */
  filterByCategory(cat, btnEl) {
    this.activeCategory = cat;

    // Update button states
    document.querySelectorAll('#doctor-category-filters .cat-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    this.renderDoctors(this.filtered());
  },

  /* ── Render ───────────────────────────────────── */
  renderDoctors(doctors) {
    if (!doctors.length) {
      this.container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--gray-400)">
          <i class="fas fa-user-md" style="font-size:3rem;opacity:0.25;margin-bottom:1rem;display:block"></i>
          <p>No doctors found in this category.</p>
          <button class="btn btn-outline btn-sm" onclick="DoctorsModule.filterByCategory('',null)" style="margin-top:0.75rem">
            View All Doctors
          </button>
        </div>`;
      return;
    }

    this.container.innerHTML = doctors.map((doc, idx) => this.buildCard(doc, idx)).join('');

    if (window.AnimationsModule) window.AnimationsModule.observeElements();
  },

  buildCard(doc, idx) {
    const stars    = this.buildStars(doc.rating);
    const imgSrc   = doc.image && doc.image.startsWith('http') ? doc.image : (this.resolveBasePath() + (doc.image || ''));
    const imgFb    = doc.imageFallback || '';
    const catConf  = this.categoryConfig[doc.category] || this.categoryConfig['Neurology'];
    const delay    = (idx % 4) * 90;
    const statusBg = doc.available ? '' : 'style="background:#94a3b8"';

    /* Safely encode name for onclick */
    const safeName = doc.name.replace(/'/g, "\\'");

    return `
      <article class="doctor-card animate-on-scroll fade-up"
        style="animation-delay:${delay}ms"
        aria-label="${this.esc(doc.name)}, ${this.esc(doc.specialty)}">

        <div class="doctor-image">
          <img
            src="${this.esc(imgSrc)}"
            alt="Photo of ${this.esc(doc.name)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${this.esc(imgFb || this.resolveBasePath() + 'images/doctors/placeholder.jpg')}';this.style.objectFit='contain';this.style.padding='1.5rem';this.style.background='#e8f4fd'"
          >
          <span class="doctor-status" ${statusBg}>${doc.available ? 'Available' : 'Unavailable'}</span>
        </div>

        <div class="doctor-info">
          <!-- Category badge -->
          <span class="doctor-category-badge ${catConf.cls}">
            <i class="${catConf.icon}" style="font-size:9px"></i>
            ${this.esc(doc.category || doc.specialty)}
          </span>

          <h3>${this.esc(doc.name)}</h3>
          <p class="doctor-specialty">${this.esc(doc.specialty)}</p>

          <div class="doctor-meta">
            <span class="doctor-meta-item">
              <i class="fas fa-hospital" aria-hidden="true"></i>
              ${this.esc(doc.hospital.split(',')[0])}
            </span>
            <span class="doctor-meta-item">
              <i class="fas fa-clock" aria-hidden="true"></i>
              ${doc.experience} yrs
            </span>
            ${doc.consultationFee ? `
            <span class="doctor-meta-item">
              <i class="fas fa-tag" aria-hidden="true"></i>
              ${this.esc(doc.consultationFee)}
            </span>` : ''}
          </div>

          <div class="doctor-rating" aria-label="Rating: ${doc.rating} out of 5">
            <div class="stars" aria-hidden="true">${stars}</div>
            <span class="rating-text">${doc.rating} (${doc.reviews} reviews)</span>
          </div>

          <button
            class="btn btn-primary btn-ripple"
            onclick="DoctorsModule.bookDoctor(${doc.id}, '${safeName}')"
            ${!doc.available ? 'disabled' : ''}
            style="${!doc.available ? 'opacity:0.55;cursor:not-allowed;' : ''}"
            aria-label="Book appointment with ${this.esc(doc.name)}"
          >
            <i class="fas fa-calendar-plus" aria-hidden="true"></i>
            ${doc.available ? 'Book Appointment' : 'Currently Unavailable'}
          </button>
        </div>
      </article>`;
  },

  buildStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      '<i class="fas fa-star star"></i>'.repeat(full) +
      (half ? '<i class="fas fa-star-half-alt star half"></i>' : '') +
      '<i class="far fa-star star empty"></i>'.repeat(empty)
    );
  },

  /* ── Book a doctor ────────────────────────────── */
  bookDoctor(doctorId, doctorName) {
    const apptSection  = document.getElementById('appointment');
    const doctorSelect = document.getElementById('preferred-doctor');

    if (apptSection && doctorSelect) {
      const top = apptSection.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });

      setTimeout(() => {
        for (let i = 0; i < doctorSelect.options.length; i++) {
          if (doctorSelect.options[i].value === doctorName) {
            doctorSelect.value = doctorName;
            break;
          }
        }
        if (window.App) App.showToast(`Booking with ${doctorName}`, 'info');
      }, 600);
    } else {
      const base = this.resolveBasePath();
      window.location.href = `${base}pages/appointments.html?doctor=${encodeURIComponent(doctorName)}`;
    }
  },

  /* ── Skeletons ────────────────────────────────── */
  showSkeletons() {
    this.container.innerHTML = Array(4).fill(null).map(() => `
      <div class="doctor-card skeleton-card">
        <div class="doctor-image" style="background:var(--gray-100)"></div>
        <div class="doctor-info" style="padding:1.25rem">
          <div class="skeleton-line" style="height:10px;width:45%;margin-bottom:10px"></div>
          <div class="skeleton-line" style="height:14px;width:80%;margin-bottom:8px"></div>
          <div class="skeleton-line short" style="height:11px;width:55%;margin-bottom:14px"></div>
          <div class="skeleton-line" style="height:10px;margin-bottom:6px"></div>
          <div class="skeleton-line short" style="height:10px;margin-bottom:18px"></div>
          <div class="skeleton-line" style="height:36px;border-radius:8px"></div>
        </div>
      </div>`).join('');
  },

  /* ── Helpers ──────────────────────────────────── */
  resolveBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  },

  esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  getFallbackDoctors() {
    return [
      { id:1, name:'Dr. Sylvia Blyden',         specialty:'Public Health Physician',             category:'Public Health',    hospital:'Ministry of Health, Freetown',                experience:22, rating:4.9, reviews:341, image:'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 250,000' },
      { id:2, name:'Dr. Alpha Tejan-Jalloh',    specialty:'Cardiologist',                        category:'Cardiology',       hospital:'Connaught Hospital, Freetown',                experience:18, rating:4.8, reviews:214, image:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 300,000' },
      { id:3, name:'Dr. Yvonne Carew',           specialty:'Gynecologist & Reproductive Health', category:"Women's Health",   hospital:'Princess Christian Maternity Hospital',       experience:16, rating:4.9, reviews:412, image:'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 250,000' },
      { id:4, name:'Dr. Fatmata Koroma-Bangura', specialty:'Reproductive Health & Safe Abortion Care', category:"Women's Health", hospital:'Marie Stopes Sierra Leone, Freetown',  experience:14, rating:4.9, reviews:298, image:'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 200,000' },
      { id:5, name:'Dr. Bankole Kargbo',         specialty:'Pediatrician',                       category:'Pediatrics',       hospital:"Ola During Children's Hospital, Freetown",   experience:15, rating:4.8, reviews:367, image:'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 200,000' },
      { id:6, name:'Dr. Agnes Macauley',         specialty:'Mental Health & Psychiatry',         category:'Mental Health',    hospital:'Sierra Leone Psychiatric Hospital, Kissy',    experience:19, rating:4.8, reviews:203, image:'https://images.unsplash.com/photo-1610550603522-15d21ad79a63?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 230,000' },
      { id:7, name:'Dr. Amara Jambai',           specialty:'Epidemiologist & Infectious Disease',category:'Infectious Disease',hospital:'National Public Health Agency of Sierra Leone',experience:20,rating:4.9, reviews:289, image:'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80', imageFallback:'', available:true,  consultationFee:'SLL 280,000' },
      { id:8, name:'Dr. Edward Nahim',           specialty:'General Surgeon',                    category:'Surgery',          hospital:'Sierra Leone Military Hospital, Wilberforce',  experience:24, rating:4.9, reviews:278, image:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80', imageFallback:'', available:false, consultationFee:'SLL 400,000' }
    ];
  }
};

document.addEventListener('DOMContentLoaded', () => DoctorsModule.init());
window.DoctorsModule = DoctorsModule;
