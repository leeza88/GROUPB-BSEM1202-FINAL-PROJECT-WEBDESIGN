/**
 * auth.js — Authentication System (localStorage-based)
 * SaloneMedConnect
 * Handles: signup, login, logout, session persistence, UI state
 */

'use strict';

const Auth = {
  STORAGE_KEYS: {
    users:       'smk_users',
    currentUser: 'smk_current_user',
    session:     'smk_session'
  },

  /* ─── Public API ──────────────────────────────── */

  init() {
    this.updateNavUI();
    this.protectDashboard();
  },

  /**
   * Register a new user
   * @returns { success, message, user }
   */
  register({ fullName, email, phone, password, dob, gender }) {
    const users = this.getUsers();

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const user = {
      id:         this._uid(),
      fullName:   fullName.trim(),
      email:      email.toLowerCase().trim(),
      phone:      phone.trim(),
      passwordHash: this._hash(password),
      dob:        dob  || '',
      gender:     gender || '',
      avatar:     this._initials(fullName),
      createdAt:  new Date().toISOString(),
      appointments: [],
      medicalHistory: [],
      savedDoctors: []
    };

    users.push(user);
    this._saveUsers(users);
    this._setSession(user);

    return { success: true, message: 'Account created successfully!', user };
  },

  /**
   * Login existing user
   * @returns { success, message, user }
   */
  login(email, password) {
    const users = this.getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    if (user.passwordHash !== this._hash(password)) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    this._setSession(user);
    return { success: true, message: 'Welcome back!', user };
  },

  /**
   * Logout current user
   */
  logout() {
    sessionStorage.removeItem(this.STORAGE_KEYS.session);
    localStorage.removeItem(this.STORAGE_KEYS.currentUser);
    window.location.href = this._basePath() + 'index.html';
  },

  /**
   * Get currently logged-in user (or null)
   */
  getCurrentUser() {
    try {
      const session = sessionStorage.getItem(this.STORAGE_KEYS.session)
                   || localStorage.getItem(this.STORAGE_KEYS.currentUser);
      return session ? JSON.parse(session) : null;
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  /**
   * Update user data (appointments, etc.)
   */
  updateUser(updatedUser) {
    const users = this.getUsers();
    const idx   = users.findIndex(u => u.id === updatedUser.id);
    if (idx === -1) return;
    users[idx] = { ...users[idx], ...updatedUser };
    this._saveUsers(users);
    this._setSession(users[idx]);
  },

  /**
   * Add booking to user profile
   */
  addBooking(bookingData) {
    const user = this.getCurrentUser();
    if (!user) return;

    const allUsers = this.getUsers();
    const idx = allUsers.findIndex(u => u.id === user.id);
    if (idx === -1) return;

    const booking = {
      id:     this._uid(),
      ...bookingData,
      status: 'Pending',
      bookedAt: new Date().toISOString()
    };

    if (!allUsers[idx].appointments) allUsers[idx].appointments = [];
    allUsers[idx].appointments.unshift(booking);
    this._saveUsers(allUsers);
    this._setSession(allUsers[idx]);
    return booking;
  },

  /* ─── UI Helpers ──────────────────────────────── */

  /**
   * Update navbar to show login/logout based on session
   */
  updateNavUI() {
    const user       = this.getCurrentUser();
    const base       = this._basePath();
    const loginLinks = document.querySelectorAll('[data-auth-login]');
    const userMenus  = document.querySelectorAll('[data-auth-user]');
    const authBtns   = document.querySelectorAll('[data-auth-btn]');

    if (user) {
      loginLinks.forEach(el => el.style.display = 'none');
      userMenus.forEach(el => {
        el.style.display = 'flex';
        el.innerHTML = `
          <div class="user-menu-trigger" onclick="Auth.toggleUserMenu()" aria-haspopup="true" aria-expanded="false">
            <div class="user-avatar-sm">${user.avatar || user.fullName.charAt(0)}</div>
            <span class="user-name-sm">${user.fullName.split(' ')[0]}</span>
            <i class="fas fa-chevron-down" style="font-size:10px"></i>
          </div>
          <div class="user-dropdown" id="user-dropdown" role="menu">
            <div class="user-dropdown-header">
              <div class="user-avatar-lg">${user.avatar || user.fullName.charAt(0)}</div>
              <div>
                <strong>${user.fullName}</strong>
                <span>${user.email}</span>
              </div>
            </div>
            <a href="${base}pages/dashboard.html" class="dropdown-item" role="menuitem"><i class="fas fa-th-large"></i> Dashboard</a>
            <a href="${base}pages/dashboard.html#appointments" class="dropdown-item" role="menuitem"><i class="fas fa-calendar-check"></i> My Appointments</a>
            <a href="${base}pages/dashboard.html#profile" class="dropdown-item" role="menuitem"><i class="fas fa-user-edit"></i> Edit Profile</a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-danger" onclick="Auth.logout()" role="menuitem"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
          </div>
        `;
      });
      authBtns.forEach(el => el.style.display = 'none');
    } else {
      loginLinks.forEach(el => el.style.display = '');
      userMenus.forEach(el => el.style.display = 'none');
    }
  },

  toggleUserMenu() {
    const dd = document.getElementById('user-dropdown');
    if (!dd) return;
    const isOpen = dd.classList.toggle('open');
    const trigger = dd.previousElementSibling;
    if (trigger) trigger.setAttribute('aria-expanded', isOpen);
    if (isOpen) {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-auth-user]')) {
          dd.classList.remove('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      }, { once: true });
    }
  },

  /**
   * Redirect to login if page requires auth
   */
  protectDashboard() {
    const isDashboard = window.location.pathname.includes('dashboard.html');
    if (isDashboard && !this.isLoggedIn()) {
      window.location.href = this._basePath() + 'pages/login.html?redirect=dashboard';
    }
  },

  /* ─── Private Helpers ─────────────────────────── */

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.users) || '[]');
    } catch { return []; }
  },

  _saveUsers(users) {
    localStorage.setItem(this.STORAGE_KEYS.users, JSON.stringify(users));
  },

  _setSession(user) {
    // Store minimal info in both for cross-tab + persistence
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    sessionStorage.setItem(this.STORAGE_KEYS.session, JSON.stringify(safeUser));
    localStorage.setItem(this.STORAGE_KEYS.currentUser, JSON.stringify(safeUser));
  },

  /** Simple deterministic hash (not cryptographic — demo only) */
  _hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  },

  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  _initials(name) {
    return name.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
  },

  _basePath() {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '../' : '';
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
window.Auth = Auth;
