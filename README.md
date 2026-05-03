# NewsWave – Personalised News Aggregator

A full-stack personalized news aggregator with community discussions, reading analytics dashboard, and a global reusable navbar component.

## 🚀 Quick Start

```bash
npm install
npm start
```
Open http://localhost:3000

## ✨ What's New (Navbar Refactor)

- **Global Reusable Navbar** (`public/components/navbar.js`) — single component used across ALL pages
- **Category Dropdown** near the search bar — replaces inline nav category items
- **Profile Section** in navbar — shows username + avatar, click to navigate to Personal Info page
- **Personal Information Page** (`public/profile.html`) — save name, bio, phone, location, favourite categories
- **Dashboard** and **Community** pages share the exact same navbar

## 📁 Project Structure

```
personalised-news-/
├── server.js                    # Express backend (auth, comments API)
├── package.json
├── public/
│   ├── components/
│   │   └── navbar.js            # ⭐ Global reusable navbar component
│   ├── assets/
│   │   └── logo.svg
│   ├── index.html               # Homepage
│   ├── dashboard.html           # Reading analytics dashboard
│   ├── community.html           # Community discussions
│   ├── profile.html             # Personal information page (NEW)
│   ├── login.html               # Login / Register
│   ├── style.css                # Global styles
│   ├── profile-styles.css       # Profile page styles (NEW)
│   ├── dashboard-styles.css
│   ├── community-styles.css
│   ├── newsletter-styles.css
│   ├── script.js                # Homepage news logic
│   ├── dashboard-logic.js
│   ├── community.js
│   ├── auth.js
│   ├── user-preferences.js
│   ├── sentiment-analysis.js
│   └── newsletter.js
```

## 🧩 Using the Navbar Component

```js
GlobalNavbar.init({
  activePage: 'home',          // 'home' | 'dashboard' | 'community' | 'profile'
  onCategorySelect: function(cat) { fetchNews(cat); },
  onSearch: function(query)    { fetchNews(query); }
});
```

Add `<div id="global-navbar"></div>` in your HTML body and load `components/navbar.js` before calling `GlobalNavbar.init()`.

## 🔑 Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Auth:** JWT + bcryptjs
- **APIs:** NewsAPI, EmailJS
