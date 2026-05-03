const API_KEY = "7c6beaed882a445a91bc1cb4a7d02670";
const url = "https://newsapi.org/v2/everything?q=";
const MAX_ARTICLES = 20;

// ─── FIX 1: defer search-button binding until DOM is fully ready ──────────────
// script.js no longer directly binds #search-button or #search-text
// because those elements now live inside navbar.js and are injected dynamically.
// The GlobalNavbar.init() call in the HTML handles search/category binding.

// ─── Load page ────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    fetchNews(q && q.trim() ? q.trim() : "India");
});

// ─── Called by navbar category dropdown ──────────────────────────────────────
function onNavItemClick(id) {
    if (!id) return;
    fetchNews(id);
}

// ─── FIX 2: Robust fetchNews with error handling + max 20 articles ────────────
let enrichedArticles = [];

async function fetchNews(query) {
    showLoadingCards();
    try {
        // Use pageSize=20 at API level too — belt and suspenders with slice(0,20)
        const res = await fetch(`${url}${encodeURIComponent(query)}&apiKey=${API_KEY}&pageSize=20`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        if (data.status === "error") {
            showError(data.message || "NewsAPI returned an error.");
            return;
        }

        const articles = data.articles || [];
        if (articles.length === 0) {
            showEmpty(query);
            return;
        }

        // FIX: Slice to MAX 20 articles
        bindData(articles.slice(0, MAX_ARTICLES));
    } catch (err) {
        showError("Could not load articles. Check your connection or API key. (" + err.message + ")");
    }
}

// ─── Render cards ─────────────────────────────────────────────────────────────
function bindData(articles) {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    if (!cardsContainer || !newsCardTemplate) return;

    cardsContainer.innerHTML = "";
    enrichedArticles = [];

    let rendered = 0;
    // FIX: filter articles without image, but still respect MAX_ARTICLES total rendered
    for (let i = 0; i < articles.length && rendered < MAX_ARTICLES; i++) {
        const article = articles[i];
        if (!article.urlToImage) continue; // skip articles with no image
        const enrichedArticle = enrichArticle(article);
        enrichedArticles.push(enrichedArticle);
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, enrichedArticle);
        cardsContainer.appendChild(cardClone);
        rendered++;
    }

    // If all articles had no image, show empty state
    if (rendered === 0) {
        cardsContainer.innerHTML = `
            <div class="state-message">
                <span style="font-size:2.5rem">🗞️</span>
                <h3>No articles with images found</h3>
                <p>Try a different search query.</p>
            </div>`;
    }
}

function enrichArticle(article) {
    const textToAnalyze = `${article.title || ''} ${article.description || ''}`;
    const sentiment = (typeof analyzeSentiment === 'function')
        ? analyzeSentiment(textToAnalyze)
        : { label: 'neutral' };
    const keywords = (typeof extractKeywords === 'function')
        ? extractKeywords(textToAnalyze)
        : [];

    return {
        ...article,
        sentiment,
        keywords,
        category: getCurrentCategory()
    };
}

function getCurrentCategory() {
    // Check active category chip in navbar dropdown
    const selectedCat = document.querySelector('.category-option.selected');
    if (selectedCat) return selectedCat.dataset.category || 'general';
    return 'general';
}

function fillDataInCard(cardClone, article) {
    const newsImg       = cardClone.querySelector("#news-img");
    const newsTitle     = cardClone.querySelector("#news-title");
    const newsSource    = cardClone.querySelector("#news-source");
    const newsDesc      = cardClone.querySelector("#news-desc");
    const sentimentBadge = cardClone.querySelector("#sentiment-badge");
    const interestedBtn = cardClone.querySelector("#interested-btn");

    // Image — fallback if image fails to load
    newsImg.src = article.urlToImage;
    newsImg.alt = article.title || "News image";
    newsImg.onerror = function () {
        this.src = "https://via.placeholder.com/400x200?text=No+Image";
    };

    newsTitle.textContent = article.title || "Untitled";
    newsDesc.textContent  = article.description || "No description available.";

    const date = article.publishedAt
        ? new Date(article.publishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "";
    newsSource.textContent = `${(article.source && article.source.name) || "Unknown"} · ${date}`;

    if (sentimentBadge && article.sentiment) {
        const label = article.sentiment.label || "neutral";
        sentimentBadge.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        sentimentBadge.className = `sentiment-badge sentiment-${label}`;
    }

    if (interestedBtn) {
        interestedBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof trackInterest === 'function') trackInterest(article);
            interestedBtn.textContent = "✓ Saved";
            interestedBtn.classList.add("clicked");
            interestedBtn.disabled = true;
        });
    }

    // Card click → open article
    const cardRoot = cardClone.firstElementChild;
    if (cardRoot) {
        cardRoot.style.cursor = "pointer";
        cardRoot.addEventListener("click", () => {
            if (typeof trackArticleClick === 'function') trackArticleClick(article);
            window.open(article.url, "_blank");
        });
    }
}

// ─── Recommended section ──────────────────────────────────────────────────────
function toggleRecommendedView() {
    const mainSection = document.querySelector("main:not(#recommended-section)");
    const recommendedSection = document.getElementById("recommended-section");
    const toggleBtn = document.getElementById("toggle-recommended-btn");
    if (!recommendedSection) return;

    const isHidden = recommendedSection.classList.contains("hidden");
    if (isHidden) {
        if (mainSection) mainSection.classList.add("hidden");
        recommendedSection.classList.remove("hidden");
        toggleBtn.textContent = "📰 View All News";
        toggleBtn.classList.add("active");
        showRecommendedArticles();
    } else {
        if (mainSection) mainSection.classList.remove("hidden");
        recommendedSection.classList.add("hidden");
        toggleBtn.textContent = "📊 View Recommended For You";
        toggleBtn.classList.remove("active");
    }
}

// ─── FIX 3: Recommendation page with fallback if no prefs yet ─────────────────
function showRecommendedArticles() {
    const recommendedContainer = document.getElementById("recommended-cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");
    if (!recommendedContainer || !newsCardTemplate) return;

    recommendedContainer.innerHTML = "";

    // getRecommendedArticles handles both preference-based + similarity fallback
    let recommended = [];
    if (typeof getRecommendedArticles === 'function') {
        // Pass all enriched articles fetched so far
        const pool = enrichedArticles.length > 0 ? enrichedArticles : [];
        recommended = getRecommendedArticles(pool);
    }

    if (!recommended || recommended.length === 0) {
        recommendedContainer.innerHTML = `
            <div class="state-message">
                <span style="font-size:2.5rem">📌</span>
                <h3>Loading recommendations…</h3>
                <p>Browse some articles first and we'll personalise picks for you here.</p>
                <button class="toggle-btn" style="margin-top:1rem" onclick="toggleRecommendedView()">← Back to All News</button>
            </div>`;
        return;
    }

    let rendered = 0;
    recommended.forEach((article) => {
        if (rendered >= MAX_ARTICLES) return;
        if (!article.urlToImage) return;

        const cardClone = newsCardTemplate.content.cloneNode(true);
        const newsImg        = cardClone.querySelector("#news-img");
        const newsTitle      = cardClone.querySelector("#news-title");
        const newsSource     = cardClone.querySelector("#news-source");
        const newsDesc       = cardClone.querySelector("#news-desc");
        const sentimentBadge = cardClone.querySelector("#sentiment-badge");
        const interestedBtn  = cardClone.querySelector("#interested-btn");

        newsImg.src = article.urlToImage;
        newsImg.alt = article.title || "";
        newsImg.onerror = function() { this.src = "https://via.placeholder.com/400x200?text=No+Image"; };
        newsTitle.textContent  = article.title || "Untitled";
        newsDesc.textContent   = article.description || "";
        const date = article.publishedAt
            ? new Date(article.publishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "";
        newsSource.textContent = `${(article.source && article.source.name) || ""} · ${date}`;

        if (sentimentBadge && article.sentiment) {
            const label = article.sentiment.label || "neutral";
            sentimentBadge.textContent = label.charAt(0).toUpperCase() + label.slice(1);
            sentimentBadge.className   = `sentiment-badge sentiment-${label}`;
        }

        // No percentage shown — clean card, same as main feed
        if (interestedBtn) {
            interestedBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof trackInterest === 'function') trackInterest(article);
                interestedBtn.textContent = "✓ Saved";
                interestedBtn.classList.add("clicked");
                interestedBtn.disabled = true;
            });
        }

        const cardRoot = cardClone.firstElementChild;
        if (cardRoot) {
            cardRoot.style.cursor = "pointer";
            cardRoot.addEventListener("click", () => {
                if (typeof trackArticleClick === 'function') trackArticleClick(article);
                window.open(article.url, "_blank");
            });
        }

        recommendedContainer.appendChild(cardClone);
        rendered++;
    });

    if (rendered === 0) {
        recommendedContainer.innerHTML = `
            <div class="state-message">
                <span style="font-size:2.5rem">🗞️</span>
                <h3>No matching articles found</h3>
                <p>Try browsing more news first.</p>
            </div>`;
    }
}

// ─── UI State helpers ─────────────────────────────────────────────────────────
function showLoadingCards() {
    const cardsContainer = document.getElementById("cards-container");
    if (!cardsContainer) return;
    cardsContainer.innerHTML = "";
    for (let i = 0; i < 8; i++) {
        cardsContainer.innerHTML += `
        <div class="card skeleton-card" aria-hidden="true">
            <div class="card-header">
                <div class="skeleton skeleton-image" style="height:200px;width:100%;border-radius:8px 8px 0 0;"></div>
            </div>
            <div class="card-content" style="padding:12px;">
                <div class="skeleton skeleton-heading" style="height:18px;width:80%;margin-bottom:8px;"></div>
                <div class="skeleton skeleton-text" style="height:13px;width:50%;margin-bottom:12px;"></div>
                <div class="skeleton skeleton-text" style="height:13px;width:100%;margin-bottom:6px;"></div>
                <div class="skeleton skeleton-text" style="height:13px;width:90%;"></div>
            </div>
        </div>`;
    }
}

function showError(msg) {
    const cardsContainer = document.getElementById("cards-container");
    if (!cardsContainer) return;
    cardsContainer.innerHTML = `
        <div class="state-message">
            <span style="font-size:2.5rem">⚠️</span>
            <h3>Could not load news</h3>
            <p>${msg}</p>
            <button class="search-button" style="margin-top:1rem" onclick="fetchNews('India')">Try Again</button>
        </div>`;
}

function showEmpty(query) {
    const cardsContainer = document.getElementById("cards-container");
    if (!cardsContainer) return;
    cardsContainer.innerHTML = `
        <div class="state-message">
            <span style="font-size:2.5rem">🔍</span>
            <h3>No results for "${query}"</h3>
            <p>Try a different keyword or category.</p>
        </div>`;
}

function reload() { window.location.reload(); }
