/**
 * appointment.js - Appointment Form Logic & Validation
 * SaloneMedConnect
 */

'use strict';

const AppointmentModule = {
  form: null,
  isSubmitting: false,

  init() {
    this.form = document.getElementById('appointment-form');
    if (!this.form) return;

    this.populateDoctorSelect();
    this.setMinDate();
    this.setupValidation();
    this.setupSubmit();
    this.checkURLParams();
  },

  /**
   * Set minimum booking date to tomorrow
   */
  setMinDate() {
    const dateInput = this.form.querySelector('#appointment-date');
    if (!dateInput) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];

    // Max date: 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
  },

  /**
   * Populate doctor dropdown from data
   */
  async populateDoctorSelect() {
    const select = this.form.querySelector('#preferred-doctor');
    if (!select) return;

    const base = window.location.pathname.includes('/pages/') ? '../' : '';

    try {
      const response = await fetch(`${base}data/doctors.json`);
      const doctors = await response.json();

      // Group by specialty
      const groups = doctors.reduce((acc, doc) => {
        if (!acc[doc.specialty]) acc[doc.specialty] = [];
        acc[doc.specialty].push(doc);
        return acc;
      }, {});

      // Build option groups
      let optionsHTML = '<option value="" disabled selected>-- Select a Doctor --</option>';
      Object.entries(groups).forEach(([specialty, docs]) => {
        optionsHTML += `<optgroup label="${specialty}">`;
        docs.forEach(doc => {
          const available = doc.available ? '' : ' (Unavailable)';
          optionsHTML += `<option value="${doc.name}" ${!doc.available ? 'disabled' : ''}>${doc.name}${available}</option>`;
        });
        optionsHTML += '</optgroup>';
      });

      select.innerHTML = optionsHTML;
    } catch {
      // Fallback options
      select.innerHTML = `
        <option value="" disabled selected>-- Select a Doctor --</option>
        <option>Dr. Aminata Koroma (General Practitioner)</option>
        <option>Dr. Mohamed Sesay (Cardiologist)</option>
        <option>Dr. Fatima Bangura (Pediatrician)</option>
        <option>Dr. Mariama Turay (Gynecologist)</option>
        <option>Dr. Emmanuel Johnson (Dermatologist)</option>
        <option>Dr. Sarah Williams (Ophthalmologist)</option>
      `;
    }
  },

  /**
   * Check URL parameters to pre-fill doctor
   */
  checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const doctor = params.get('doctor');
    if (!doctor) return;

    const select = this.form.querySelector('#preferred-doctor');
    if (!select) return;

    // Wait for options to populate
    setTimeout(() => {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === doctor) {
          select.value = doctor;
          break;
        }
      }
    }, 500);
  },

  /**
   * Validation rules
   */
  rules: {
    'full-name': {
      required: true,
      minLength: 3,
      pattern: /^[a-zA-Z\s'-]+$/,
      messages: {
        required:  'Full name is required.',
        minLength: 'Name must be at least 3 characters.',
        pattern:   'Please enter a valid name (letters only).'
      }
    },
    'email': {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        required: 'Email address is required.',
        pattern:  'Please enter a valid email address.'
      }
    },
    'phone': {
      required: true,
      pattern: /^[\+]?[\d\s\-\(\)]{8,15}$/,
      messages: {
        required: 'Phone number is required.',
        pattern:  'Please enter a valid phone number (e.g., +232 76 123456).'
      }
    },
    'preferred-doctor': {
      required: true,
      messages: { required: 'Please select a doctor.' }
    },
    'appointment-date': {
      required: true,
      messages: { required: 'Please choose a date for your appointment.' }
    },
    'appointment-time': {
      required: true,
      messages: { required: 'Please select a preferred time slot.' }
    }
  },

  /**
   * Live validation on input blur
   */
  setupValidation() {
    Object.keys(this.rules).forEach(fieldId => {
      const field = this.form.querySelector(`#${fieldId}`);
      if (!field) return;

      field.addEventListener('blur', () => this.validateField(fieldId));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) this.validateField(fieldId);
      });
    });
  },

  validateField(fieldId) {
    const field = this.form.querySelector(`#${fieldId}`);
    const rule  = this.rules[fieldId];
    const errorEl = this.form.querySelector(`#${fieldId}-error`);
    if (!field || !rule) return true;

    const value = field.value.trim();
    let isValid = true;
    let message = '';

    if (rule.required && !value) {
      isValid = false;
      message = rule.messages.required;
    } else if (value && rule.minLength && value.length < rule.minLength) {
      isValid = false;
      message = rule.messages.minLength;
    } else if (value && rule.pattern && !rule.pattern.test(value)) {
      isValid = false;
      message = rule.messages.pattern;
    }

    field.classList.toggle('error', !isValid);
    field.classList.toggle('valid', isValid && value !== '');
    field.setAttribute('aria-invalid', !isValid);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle('show', !isValid);
    }

    return isValid;
  },

  validateAll() {
    return Object.keys(this.rules).every(id => this.validateField(id));
  },

  /**
   * Form submission handler
   */
  setupSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isSubmitting) return;

      const isValid = this.validateAll();
      if (!isValid) {
        this.form.querySelector('.error')?.focus();
        return;
      }

      await this.submitForm();
    });
  },

  async submitForm() {
    this.isSubmitting = true;
    const btn = this.form.querySelector('.form-submit-btn');
    const feedback = this.form.querySelector('.form-feedback');

    // Show loading state
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner anim-spin"></i> Submitting...';
    btn.disabled = true;

    if (feedback) feedback.className = 'form-feedback';

    // Collect form data
    const data = {
      fullName:    this.form.querySelector('#full-name')?.value.trim(),
      email:       this.form.querySelector('#email')?.value.trim(),
      phone:       this.form.querySelector('#phone')?.value.trim(),
      doctor:      this.form.querySelector('#preferred-doctor')?.value,
      date:        this.form.querySelector('#appointment-date')?.value,
      time:        this.form.querySelector('#appointment-time')?.value,
      message:     this.form.querySelector('#message')?.value.trim(),
      submittedAt: new Date().toISOString()
    };

    // Simulate API call (replace with real backend endpoint)
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Success (simulated)
    const success = true;

    if (success) {
      this.showSuccess(feedback, data);
      this.form.reset();
      this.form.querySelectorAll('.valid').forEach(el => el.classList.remove('valid'));

      // Save booking to user account if logged in, otherwise save to localStorage
      if (window.Auth && Auth.isLoggedIn()) {
        Auth.addBooking(data);
        if (window.App) App.showToast('Appointment booked! Redirecting to your dashboard...', 'success', 3000);
        // Redirect to dashboard after 2.5s
        setTimeout(() => {
          const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
          window.location.href = base + 'dashboard.html#appointments';
        }, 2500);
      } else {
        this.storeBooking(data);
        if (window.App) App.showToast('Appointment saved! Sign in to track it on your dashboard.', 'info', 5000);
        // Redirect to login with message after 2.5s
        setTimeout(() => {
          const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
          window.location.href = base + 'login.html?msg=booking';
        }, 2500);
      }
    } else {
      this.showError(feedback);
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
    this.isSubmitting = false;
  },

  showSuccess(el, data) {
    if (!el) return;
    const dateFormatted = data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-SL', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : data.date;
    el.className = 'form-feedback success';
    el.innerHTML = `
      <i class="fas fa-check-circle" style="font-size:1.5rem;flex-shrink:0"></i>
      <div>
        <strong>Appointment Request Confirmed!</strong><br>
        Thank you, <strong>${data.fullName}</strong>. Your appointment with <strong>${data.doctor}</strong>
        has been requested for <strong>${dateFormatted}</strong> at <strong>${data.time}</strong>.
        A confirmation will be sent to <strong>${data.email}</strong>.
      </div>
    `;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  showError(el) {
    if (!el) return;
    el.className = 'form-feedback error-fb';
    el.innerHTML = `
      <i class="fas fa-times-circle" style="font-size:1.5rem;flex-shrink:0"></i>
      <div>
        <strong>Submission Failed</strong><br>
        We couldn't process your request. Please try again or call us at <strong>+232 76 000 911</strong>.
      </div>
    `;
  },

  storeBooking(data) {
    try {
      const bookings = JSON.parse(localStorage.getItem('smk_bookings') || '[]');
      bookings.push({ ...data, id: Date.now() });
      localStorage.setItem('smk_bookings', JSON.stringify(bookings.slice(-10)));
    } catch (e) {
      // localStorage may be unavailable
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppointmentModule.init();
});

window.AppointmentModule = AppointmentModule;
