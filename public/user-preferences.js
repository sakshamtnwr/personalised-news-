
function getUserStorageKey() {
    const email = sessionStorage.getItem('userEmail') || 'guest';
    return 'newsPrefs_' + email;
}

let userPreferences = null;

function loadUserPreferences() {
    const raw = localStorage.getItem(getUserStorageKey());
    if (raw) {
        userPreferences = JSON.parse(raw);
    } else {
        userPreferences = {
            categories:          {},
            keywords:            {},
            sentiment_preference: 'neutral',
            clicked_articles:    [],
            interested_articles: []
        };
    }
    return userPreferences;
}

function saveUserPreferences() {
    if (userPreferences) {
        localStorage.setItem(getUserStorageKey(), JSON.stringify(userPreferences));
    }
}

function clearUserPreferences() {
    localStorage.removeItem(getUserStorageKey());
    userPreferences = null;
}

function trackArticleClick(article) {
    if (!userPreferences) loadUserPreferences();
    const cat = article.category || 'general';
    userPreferences.categories[cat] = (userPreferences.categories[cat] || 0) + 1;
    if (article.keywords) {
        article.keywords.forEach(kw => {
            userPreferences.keywords[kw] = (userPreferences.keywords[kw] || 0) + 1;
        });
    }
    const alreadyClicked = userPreferences.clicked_articles.some(a => a.url === article.url);
    if (!alreadyClicked) {
        userPreferences.clicked_articles.push({
            url:       article.url,
            title:     article.title,
            category:  cat,
            keywords:  article.keywords || [],
            sentiment: article.sentiment?.label || 'neutral',
            timestamp: new Date().toISOString()
        });
        if (userPreferences.clicked_articles.length > 50)
            userPreferences.clicked_articles.shift();
    }
    saveUserPreferences();
}

function trackInterest(article) {
    if (!userPreferences) loadUserPreferences();
    const cat = article.category || 'general';
    userPreferences.categories[cat] = (userPreferences.categories[cat] || 0) + 3;
    if (article.keywords) {
        article.keywords.forEach(kw => {
            userPreferences.keywords[kw] = (userPreferences.keywords[kw] || 0) + 3;
        });
    }
    const alreadySaved = userPreferences.interested_articles.some(a => a.url === article.url);
    if (!alreadySaved) {
        userPreferences.interested_articles.push({
            url:       article.url,
            title:     article.title,
            category:  cat,
            keywords:  article.keywords || [],
            sentiment: article.sentiment?.label || 'neutral',
            timestamp: new Date().toISOString()
        });
        if (userPreferences.interested_articles.length > 50)
            userPreferences.interested_articles.shift();
    }
    saveUserPreferences();
}

function getRecommendationScore(article) {
    if (!userPreferences) loadUserPreferences();
    let score = 0;
    const cat = article.category || 'general';
    if (userPreferences.categories[cat])
        score += userPreferences.categories[cat] * 0.3;
    if (article.keywords) {
        article.keywords.forEach(kw => {
            if (userPreferences.keywords[kw])
                score += userPreferences.keywords[kw] * 0.5;
        });
    }
    const sentMap = { positive: 1, neutral: 0, negative: -1 };
    const prefSent = userPreferences.sentiment_preference || 'neutral';
    const artSent  = article.sentiment?.label || 'neutral';
    if (artSent === prefSent) score += 2 * 0.2;
    return score;
}

// Call on page load
loadUserPreferences();

/**
 * getRecommendedArticles
 * Scores all articles based on user preference history.
 * Falls back to keyword/title similarity when no preference data exists.
 * Returns sorted array — highest score first. No percentage exposed.
 */
function getRecommendedArticles(articles) {
    if (!userPreferences) loadUserPreferences();
    if (!articles || articles.length === 0) return [];

    const hasPrefData =
        Object.keys(userPreferences.categories).length > 0 ||
        Object.keys(userPreferences.keywords).length > 0 ||
        userPreferences.clicked_articles.length > 0 ||
        userPreferences.interested_articles.length > 0;

    if (hasPrefData) {
        // ── Preference-based scoring ─────────────────────────
        const scored = articles.map(article => {
            const score = getRecommendationScore(article);
            return { ...article, _recScore: score };
        });
        // Sort descending; exclude articles already explicitly clicked
        const clickedUrls = new Set(userPreferences.clicked_articles.map(a => a.url));
        return scored
            .filter(a => !clickedUrls.has(a.url))
            .sort((a, b) => b._recScore - a._recScore);
    }

    // ── Fallback: content-similarity when no prefs yet ────────
    // Build a combined text index from all article titles+descriptions,
    // then rank by shared word overlap with each other article (TF-style).
    const stopWords = new Set([
        'the','a','an','and','or','but','in','on','at','to','for',
        'of','with','by','from','is','are','was','were','be','been',
        'has','have','had','will','would','can','could','should','may',
        'might','do','does','did','it','this','that','these','those',
        'its','as','if','so','not','no','up','out','about','into',
        'than','then','when','where','who','which','what','how','says',
        'said','new','one','two','after','over','i','s','us','their'
    ]);

    function tokenize(str) {
        return (str || '').toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));
    }

    // Score each article by how many of its keywords appear in other articles
    const tokenized = articles.map(a => ({
        article: a,
        tokens: new Set(tokenize((a.title || '') + ' ' + (a.description || '')))
    }));

    const scored = tokenized.map(({ article, tokens }) => {
        let overlap = 0;
        tokenized.forEach(other => {
            if (other.article.url === article.url) return;
            other.tokens.forEach(t => { if (tokens.has(t)) overlap++; });
        });
        return { ...article, _recScore: overlap };
    });

    return scored.sort((a, b) => b._recScore - a._recScore);
}
