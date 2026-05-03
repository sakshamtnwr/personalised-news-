/**
 * GlobalNavbar — Reusable navbar component for NewsWave
 * FIX: overflow removed, category dropdown uses position:absolute + high z-index
 * FIX: Profile is now a direct nav button (no dropdown) → navigates to profile.html
 */

const GlobalNavbar = (() => {

  function getTemplate(activePage) {
    return `
    <nav id="app-navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-inner">

        <!-- Logo -->
        <a href="/index.html" class="company-logo" aria-label="NewsWave Home">
          <svg viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="115" height="32" aria-hidden="true">
            <rect x="0" y="5" width="26" height="26" rx="5" fill="#2294ed"/>
            <path d="M5 12h16M5 18h11M5 24h14" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <text x="32" y="26" font-family="Poppins,sans-serif" font-weight="700" font-size="17" fill="#183b56">News</text>
            <text x="74" y="26" font-family="Poppins,sans-serif" font-weight="500" font-size="17" fill="#2294ed">Wave</text>
          </svg>
        </a>

        <!-- Page Nav Buttons -->
        <div class="navbar-page-links">
          <a href="/dashboard.html" class="navbar-btn ${activePage === 'dashboard' ? 'navbar-btn--active' : ''}" aria-label="Dashboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a href="/community.html" class="navbar-btn ${activePage === 'community' ? 'navbar-btn--active' : ''}" aria-label="Community">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Community
          </a>
        </div>

        <!-- Search Group: Category dropdown + Search bar -->
        <div class="navbar-search-group">

          <!-- FIX: Category dropdown wrapper — position:relative so dropdown pops outside nav -->
          <div class="navbar-category-wrap" id="navbar-category-wrap">
            <button class="navbar-category-btn" id="category-dropdown-btn"
              aria-haspopup="listbox" aria-expanded="false" aria-label="Select category">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              <span id="category-label">Category</span>
              <svg class="caret-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            <!-- FIX: Dropdown list — rendered here, positioned absolutely, z-index: 99999 -->
            <ul class="navbar-category-dropdown" id="category-dropdown-list" role="listbox" aria-label="News categories">
              <li role="option" class="category-option" data-category="Technology" tabindex="0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Technology
              </li>
              <li role="option" class="category-option" data-category="finance" tabindex="0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Finance
              </li>
              <li role="option" class="category-option" data-category="politics" tabindex="0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Politics
              </li>
              <li role="option" class="category-option" data-category="social" tabindex="0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Social
              </li>
              <li role="option" class="category-option" data-category="trending" tabindex="0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Trending
              </li>
            </ul>
          </div>

          <!-- Search Bar -->
          <div class="navbar-search-bar">
            <input id="search-text" type="search" class="news-input"
              placeholder="Search news…" aria-label="Search news" autocomplete="off"/>
            <button id="search-button" class="search-button" aria-label="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>
          </div>
        </div>

        <!-- FIX: Profile section — direct button, no dropdown, navigates to profile.html -->
        <a href="/profile.html" class="navbar-profile-btn ${activePage === 'profile' ? 'navbar-profile-btn--active' : ''}"
          id="navbar-profile-btn" aria-label="Personal Information">
          <div class="profile-avatar" id="profile-avatar" aria-hidden="true">👤</div>
          <span class="profile-username" id="profile-username">User</span>
        </a>

      </div>
    </nav>
    `;
  }

  function injectStyles() {
    if (document.getElementById('global-navbar-styles')) return;
    const style = document.createElement('style');
    style.id = 'global-navbar-styles';
    style.textContent = `
/* =============================================
   GLOBAL NAVBAR — NewsWave
   FIX: NO overflow:hidden anywhere on nav
   FIX: Dropdowns use position:absolute + z-index:99999
   FIX: Profile is a direct link button
   ============================================= */

/* --- Reset any old nav styles that may conflict --- */
.main-nav { all: unset !important; }

#app-navbar {
  background: #f3faff;
  box-shadow: 0 1px 4px rgba(34,83,148,0.12);
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9000;
  /* CRITICAL FIX: NO overflow:hidden — allows dropdowns to escape the navbar bounds */
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 24px;
  max-width: 1280px;
  margin: 0 auto;
  flex-wrap: nowrap;
  /* CRITICAL FIX: NO overflow:hidden */
}

/* --- Logo --- */
.company-logo {
  text-decoration: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  line-height: 1;
}
.company-logo svg { display: block; }

/* --- Page nav buttons --- */
.navbar-page-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.navbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border-radius: 6px;
  font-size: 13px;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  color: #183b56;
  text-decoration: none;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}
.navbar-btn:hover {
  background: #e6f3ff;
  color: #2294ed;
  border-color: #c8e4ff;
}
.navbar-btn--active {
  background: #ddeeff;
  color: #2294ed;
  border-color: #2294ed;
  font-weight: 600;
}

/* --- Search group: category + search bar --- */
.navbar-search-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 430px;
  min-width: 0;
}

/* =========================================
   CATEGORY DROPDOWN FIX
   - position:relative on wrapper
   - position:absolute on dropdown
   - z-index: 99999 to escape everything
   ========================================= */
.navbar-category-wrap {
  position: relative;   /* FIX: anchor for absolute dropdown */
  flex-shrink: 0;
  /* NO overflow:hidden */
}

.navbar-category-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  background: white;
  border: 2px solid #bbd0e2;
  border-radius: 6px;
  font-family: "Poppins", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #183b56;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.18s, color 0.18s;
  line-height: 1;
  height: 34px;
}
.navbar-category-btn:hover,
.navbar-category-btn[aria-expanded="true"] {
  border-color: #2294ed;
  color: #2294ed;
}
.navbar-category-btn .caret-icon {
  transition: transform 0.18s ease;
}
.navbar-category-btn[aria-expanded="true"] .caret-icon {
  transform: rotate(180deg);
}

/* FIX: Category dropdown list — absolute, NOT clipped by anything */
.navbar-category-dropdown {
  position: absolute;           /* FIX: absolute positioning */
  top: calc(100% + 6px);        /* FIX: appears below the button */
  left: 0;
  background: #ffffff;
  border: 1px solid #dde8f0;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(34,83,148,0.15);
  min-width: 170px;
  list-style: none;
  padding: 6px 0;
  margin: 0;
  z-index: 99999;               /* FIX: above everything including sticky headers */
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.navbar-category-dropdown.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-family: "Poppins", sans-serif;
  font-size: 13px;
  color: #183b56;
  cursor: pointer;
  transition: background 0.15s;
  list-style: none;
  border: none;
  background: none;
  width: 100%;
}
.category-option:hover {
  background: #f0f8ff;
  color: #2294ed;
}
.category-option.selected {
  color: #2294ed;
  font-weight: 600;
  background: #eaf5ff;
}

/* --- Search bar --- */
.navbar-search-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.news-input {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  border: 2px solid #bbd0e2;
  font-family: "Roboto", sans-serif;
  font-size: 13px;
  outline: none;
  background: white;
  color: #183b56;
  transition: border-color 0.18s;
}
.news-input:focus { border-color: #2294ed; }

.search-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #2294ed;
  color: white;
  padding: 0 14px;
  height: 34px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: "Roboto", sans-serif;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.18s;
}
.search-button:hover { background: #1d69a3; }

/* =============================================
   PROFILE BUTTON FIX
   — Direct link button (no dropdown)
   — Navigates straight to profile.html
   ============================================= */
.navbar-profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px 5px 5px;
  border-radius: 50px;        /* pill shape */
  border: 1.5px solid #bbd0e2;
  background: white;
  text-decoration: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
  max-width: 160px;
}
.navbar-profile-btn:hover {
  background: #e6f3ff;
  border-color: #2294ed;
  box-shadow: 0 2px 8px rgba(34,148,237,0.15);
}
.navbar-profile-btn--active {
  background: #ddeeff;
  border-color: #2294ed;
}

.profile-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2294ed, #1d69a3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
}

.profile-username {
  font-family: "Poppins", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #183b56;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

/* --- State helpers injected by script.js --- */
.state-message {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  color: #577592;
  gap: 8px;
}
.state-message h3 {
  font-family: "Poppins", sans-serif;
  font-size: 18px;
  color: #183b56;
  margin: 0;
}
.state-message p { font-size: 14px; margin: 0; max-width: 40ch; }

/* Skeleton shimmer for loading cards */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #e8f0f7 25%, #f0f6fc 50%, #e8f0f7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

/* --- Body offset for fixed navbar --- */
body { padding-top: 60px !important; }

/* --- Responsive --- */
@media (max-width: 960px) {
  .navbar-inner { flex-wrap: wrap; padding: 8px 14px; }
  .navbar-search-group { max-width: 100%; order: 3; flex: 1 1 100%; }
}
@media (max-width: 600px) {
  .navbar-btn span,
  .profile-username { display: none; }
}
    `;
    document.head.appendChild(style);
  }

  function mount(activePage) {
    const container = document.getElementById('global-navbar');
    if (!container) { console.warn('[GlobalNavbar] #global-navbar not found'); return; }
    container.innerHTML = getTemplate(activePage);
  }

  function wireCategoryDropdown(onCategorySelect) {
    const btn   = document.getElementById('category-dropdown-btn');
    const list  = document.getElementById('category-dropdown-list');
    const label = document.getElementById('category-label');
    if (!btn || !list) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = list.classList.contains('open');
      list.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    list.querySelectorAll('.category-option').forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.dataset.category;
        label.textContent = item.textContent.trim();
        list.querySelectorAll('.category-option').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        list.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        if (typeof onCategorySelect === 'function') onCategorySelect(cat, item);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function wireSearch(onSearch) {
    const searchBtn   = document.getElementById('search-button');
    const searchInput = document.getElementById('search-text');
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (typeof onSearch === 'function') { onSearch(q); }
      else if (q) { window.location.href = `/index.html?q=${encodeURIComponent(q)}`; }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchBtn.click();
    });
  }

  function populateUser() {
    // Try localStorage profile first, then sessionStorage
    let name = '', email = '';
    try {
      const storedEmail = sessionStorage.getItem('userEmail') || '';
      const profileRaw  = localStorage.getItem('newsProfile_' + storedEmail);
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        name  = profile.name || profile.username || '';
        email = storedEmail;
      } else {
        name  = sessionStorage.getItem('userName') || '';
        email = storedEmail;
      }
    } catch(e) {
      name  = sessionStorage.getItem('userName') || '';
      email = sessionStorage.getItem('userEmail') || '';
    }

    const displayName = name || (email ? email.split('@')[0] : '') || 'User';
    const initial     = displayName.charAt(0).toUpperCase();

    const usernameEl = document.getElementById('profile-username');
    const avatarEl   = document.getElementById('profile-avatar');
    if (usernameEl) usernameEl.textContent = displayName;
    if (avatarEl)   { avatarEl.textContent = initial; }
  }

  function init(opts = {}) {
    injectStyles();
    mount(opts.activePage || '');
    populateUser();
    wireCategoryDropdown(opts.onCategorySelect);
    wireSearch(opts.onSearch);
  }

  return { init, populateUser };
})();
