/**
 * nav.js — Sahara shared application navbar
 *
 * Mount:   <div id="app-nav"></div>  on any authenticated page
 * Import:  <script type="module" src="./js/nav.js"></script>
 *
 * Two-phase render:
 *  1. Render immediately with a fallback avatar so nav appears with zero delay.
 *  2. Re-render once the Supabase user resolves to show the real name/initials.
 */

import { supabase, logout, isDemoMode } from './supabaseClient.js';

// ── Nav items ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Reminders',  icon: 'pill',          href: '/reminders.html'  },
  { label: 'Companion',  icon: 'message-circle', href: '/companion.html'  },
  { label: 'SOS',        icon: 'shield-alert',   href: '/sos.html', sos: true },
  { label: 'Hospital',   icon: 'map-pin',        href: '/navigation.html' },
  { label: 'Documents',  icon: 'folder',         href: '/vault.html'      },
];

// ── Helpers ──────────────────────────────────────────────────────
function isActive(href) {
  return window.location.pathname.endsWith(href.replace(/^\//, ''));
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ── Build HTML ───────────────────────────────────────────────────
function buildNav(user) {
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split('@')[0] : 'You');
  const email = user?.email || '';

  const navItems = NAV_ITEMS.map(item => {
    const active     = isActive(item.href);
    const sosClass   = item.sos ? 'app-nav-item--sos'    : '';
    const activeClass = active  ? 'app-nav-item--active' : '';
    return `
      <a href="${item.href}"
         class="app-nav-item ${sosClass} ${activeClass}"
         aria-current="${active ? 'page' : 'false'}">
        <i data-lucide="${item.icon}" class="app-nav-item-icon"></i>
        <span class="app-nav-item-label">${item.label}</span>
      </a>`;
  }).join('');

  const avatarInner = `<span class="app-nav-avatar-initials">${initials(displayName)}</span>`;

  return `
<nav class="app-nav" role="navigation" aria-label="Main navigation">
  <div class="app-nav-inner">

    <a href="/dashboard.html" class="app-nav-logo" aria-label="Sahara dashboard">
      <img src="/logo.png" alt="Sahara">
    </a>

    <div class="app-nav-links" id="app-nav-links">
      ${navItems}
    </div>

    <div class="app-nav-right">
      <div class="app-nav-profile-wrap">
        <button class="app-nav-profile-btn"
                id="app-nav-profile-btn"
                aria-haspopup="true"
                aria-expanded="false"
                aria-controls="app-nav-dropdown">
          <div class="app-nav-avatar">${avatarInner}</div>
          <span class="app-nav-profile-label">My Profile</span>
          <i data-lucide="chevron-down" class="app-nav-chevron"></i>
        </button>

        <div class="app-nav-dropdown" id="app-nav-dropdown" role="menu" aria-hidden="true">
          <div class="app-nav-dropdown-header">
            <div class="app-nav-dropdown-avatar">${avatarInner}</div>
            <div class="app-nav-dropdown-info">
              <p class="app-nav-dropdown-name">${displayName}</p>
              <p class="app-nav-dropdown-email">${email}</p>
            </div>
          </div>
          <hr class="app-nav-dropdown-divider">
          <a href="/profile.html" class="app-nav-dropdown-item" role="menuitem">
            <i data-lucide="user"></i> View Profile
          </a>
          <button class="app-nav-dropdown-item app-nav-dropdown-logout"
                  id="app-nav-logout" role="menuitem">
            <i data-lucide="log-out"></i> Log out
          </button>
        </div>
      </div>

      <button class="app-nav-hamburger" id="app-nav-hamburger"
              aria-label="Open menu" aria-expanded="false"
              aria-controls="app-nav-links">
        <i data-lucide="menu"></i>
      </button>
    </div>

  </div>

  <div class="app-nav-drawer" id="app-nav-drawer" aria-hidden="true">
    ${navItems}
    <hr class="app-nav-drawer-divider">
    <a href="/profile.html" class="app-nav-item">
      <i data-lucide="user" class="app-nav-item-icon"></i>
      <span class="app-nav-item-label">My Profile</span>
    </a>
    <button class="app-nav-item app-nav-drawer-logout" id="app-nav-drawer-logout">
      <i data-lucide="log-out" class="app-nav-item-icon"></i>
      <span class="app-nav-item-label">Log out</span>
    </button>
  </div>
</nav>`;
}

// ── Wire interactions ────────────────────────────────────────────
function wireInteractions() {
  const profileBtn = document.getElementById('app-nav-profile-btn');
  const dropdown   = document.getElementById('app-nav-dropdown');
  const hamburger  = document.getElementById('app-nav-hamburger');
  const drawer     = document.getElementById('app-nav-drawer');

  if (!profileBtn || !dropdown || !hamburger || !drawer) return;

  // Dropdown
  function openDropdown() {
    dropdown.classList.add('app-nav-dropdown--open');
    profileBtn.setAttribute('aria-expanded', 'true');
    dropdown.setAttribute('aria-hidden', 'false');
    const first = dropdown.querySelector('a, button');
    if (first) first.focus();
  }
  function closeDropdown() {
    dropdown.classList.remove('app-nav-dropdown--open');
    profileBtn.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  }

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.contains('app-nav-dropdown--open') ? closeDropdown() : openDropdown();
  });
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
  });
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDropdown(); profileBtn.focus(); }
  });
  document.getElementById('app-nav-logout')?.addEventListener('click', async () => {
    closeDropdown();
    await logout();
  });

  // Hamburger / mobile drawer
  function openDrawer() {
    drawer.classList.add('app-nav-drawer--open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    hamburger.innerHTML = '<i data-lucide="x"></i>';
    if (window.lucide) lucide.createIcons();
  }
  function closeDrawer() {
    drawer.classList.remove('app-nav-drawer--open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    hamburger.innerHTML = '<i data-lucide="menu"></i>';
    if (window.lucide) lucide.createIcons();
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.classList.contains('app-nav-drawer--open') ? closeDrawer() : openDrawer();
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !drawer.contains(e.target)) closeDrawer();
  });
  document.getElementById('app-nav-drawer-logout')?.addEventListener('click', async () => {
    closeDrawer();
    await logout();
  });
}

// ── Mount (two-phase) ────────────────────────────────────────────
async function mountNav() {
  const mount = document.getElementById('app-nav');
  if (!mount) return;

  // Phase 1: render immediately with placeholder so nav is visible at once
  mount.innerHTML = buildNav(null);
  if (window.lucide) lucide.createIcons();
  wireInteractions();

  // Phase 2: fetch real user, re-render only if we got one
  try {
    let user = null;
    if (isDemoMode()) {
      const s = JSON.parse(localStorage.getItem('demo_session') || '{}');
      user = s?.user || { email: 'demo@sahara.com' };
    } else {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    }
    if (user) {
      mount.innerHTML = buildNav(user);
      if (window.lucide) lucide.createIcons();
      wireInteractions();
    }
  } catch (_) {
    // Phase 1 render stays — good enough fallback
  }
}

mountNav();
