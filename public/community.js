/* ==============================================================
   community.js  –  Community Page Logic
   Fetches news, renders cards in single column,
   manages threaded comments via /api/comments (JSON file).
   ============================================================== */

const API_KEY = "7c6beaed882a445a91bc1cb4a7d02670";
const NEWS_URL = "https://newsapi.org/v2/everything?q=";
const COMMUNITY_LIMIT = 8; // how many cards to show on community page

let currentArticles = [];
let activeArticleIdx = null;
let currentComments = {}; // { articleId: [ {id, author, text, time, likes, replies:[]} ] }

const AVATAR_COLORS = ['av-green','av-purple','av-orange','av-pink','av-teal',''];

function getAvatarColor(name) {
    if (!name) return '';
    const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getArticleId(article) {
    return btoa(encodeURIComponent(article.url)).slice(0, 32);
}

function getCurrentUser() {
    return sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail') || 'Anonymous';
}

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)  return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
}

/* ---------- API: Load / Save Comments via Express backend ---------- */
async function loadComments(articleId) {
    try {
        const res = await fetch(`/api/comments/${articleId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        // Fallback: use in-memory if server unavailable
        return currentComments[articleId] || [];
    }
}

async function saveComment(articleId, comment) {
    try {
        const res = await fetch(`/api/comments/${articleId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comment)
        });
        if (res.ok) return await res.json();
    } catch (e) {
        // Fallback: in-memory
        if (!currentComments[articleId]) currentComments[articleId] = [];
        currentComments[articleId].push(comment);
        return comment;
    }
}

async function saveReply(articleId, commentId, reply) {
    try {
        const res = await fetch(`/api/comments/${articleId}/${commentId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply)
        });
        if (res.ok) return await res.json();
    } catch (e) {
        // Fallback: in-memory
        const comments = currentComments[articleId] || [];
        const c = comments.find(x => x.id === commentId);
        if (c) { if (!c.replies) c.replies = []; c.replies.push(reply); }
        return reply;
    }
}

async function toggleLike(articleId, commentId) {
    try {
        const res = await fetch(`/api/comments/${articleId}/${commentId}/like`, { method: 'POST' });
        if (res.ok) return await res.json();
    } catch (e) { return null; }
}

/* ---------- Fetch News ---------- */
async function fetchCommunityNews() {
    try {
        const res = await fetch(`${NEWS_URL}India&apiKey=${API_KEY}`);
        const data = await res.json();
        if (!data.articles) throw new Error('No articles');
        currentArticles = data.articles
            .filter(a => a.urlToImage)
            .slice(0, COMMUNITY_LIMIT);
        renderFeedCards();
        document.getElementById('feed-count').textContent = `${currentArticles.length} articles · Click to discuss`;
    } catch (e) {
        document.getElementById('community-cards-list').innerHTML = `
            <div style="padding:24px;text-align:center;color:#8aa5bc;">
                <div style="font-size:28px;margin-bottom:8px;">📡</div>
                <p style="font-size:14px;">Could not load articles. Make sure the server is running and the API key is valid.</p>
            </div>`;
        document.getElementById('feed-count').textContent = 'Error loading articles';
    }
}

/* ---------- Render Feed Cards (reuse .card template structure) ---------- */
async function renderFeedCards() {
    const list = document.getElementById('community-cards-list');
    list.innerHTML = '';

    for (let i = 0; i < currentArticles.length; i++) {
        const article = currentArticles[i];
        const articleId = getArticleId(article);
        const comments = await loadComments(articleId);
        currentComments[articleId] = comments;

        const date = new Date(article.publishedAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
        const textToAnalyze = `${article.title} ${article.description || ''}`;
        const sentiment = analyzeSentiment(textToAnalyze);

        const wrapper = document.createElement('div');
        wrapper.className = 'community-card-wrapper';
        wrapper.setAttribute('data-idx', i);
        wrapper.setAttribute('data-article-id', articleId);
        wrapper.innerHTML = `
            <div class="card" role="button" tabindex="0" aria-label="Open discussion for: ${article.title.replace(/"/g,'&quot;')}">
                <div class="card-header">
                    <img src="${article.urlToImage}" alt="${article.title.substring(0,60)}"
                         loading="lazy" onerror="this.src='https://via.placeholder.com/400x160?text=No+Image'">
                </div>
                <div class="card-content">
                    <h3 id="news-title">${article.title}</h3>
                    <h6 class="news-source" id="news-source">${article.source.name} · ${date}</h6>
                    <p class="news-desc" id="news-desc">${article.description || ''}</p>
                </div>
                <div class="card-footer">
                    <span class="sentiment-badge sentiment-${sentiment.label}" id="sentiment-badge">
                        ${sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
                    </span>
                    <button class="interested-btn" onclick="event.stopPropagation(); markInterested(${i}, this)">Interested</button>
                </div>
            </div>
            <div class="card-comment-badge" id="badge-${articleId}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                ${comments.length} comment${comments.length !== 1 ? 's' : ''}
            </div>`;

        wrapper.addEventListener('click', () => openDiscussion(i));
        wrapper.addEventListener('keydown', (e) => { if (e.key === 'Enter') openDiscussion(i); });
        list.appendChild(wrapper);
    }
}

function markInterested(idx, btn) {
    const article = currentArticles[idx];
    if (!article) return;
    const enriched = { ...article, category: 'general', keywords: extractKeywords(`${article.title} ${article.description||''}`) };
    trackInterest(enriched);
    btn.textContent = '✓ Saved';
    btn.classList.add('clicked');
    btn.disabled = true;
}

/* ---------- Open Discussion Panel ---------- */
async function openDiscussion(idx) {
    // Highlight active card
    document.querySelectorAll('.community-card-wrapper').forEach(w => w.classList.remove('active-card'));
    const wrapper = document.querySelector(`.community-card-wrapper[data-idx="${idx}"]`);
    if (wrapper) wrapper.classList.add('active-card');

    activeArticleIdx = idx;
    const article = currentArticles[idx];
    const articleId = getArticleId(article);

    // Show discussion panel
    document.getElementById('discussion-empty').classList.add('hidden');
    document.getElementById('discussion-content').classList.remove('hidden');

    // Populate article header
    document.getElementById('active-img').src = article.urlToImage || '';
    document.getElementById('active-source').textContent = article.source.name;
    document.getElementById('active-title').textContent = article.title;
    document.getElementById('active-link').href = article.url;

    // Load and render comments
    await renderComments(articleId);
}

/* ---------- Render Comments ---------- */
async function renderComments(articleId) {
    const comments = await loadComments(articleId);
    currentComments[articleId] = comments;

    const list = document.getElementById('comments-list');
    list.innerHTML = '';

    // Update stats
    const participants = [...new Set(comments.map(c => c.author))];
    document.getElementById('comment-count-label').textContent = `${comments.length} comment${comments.length !== 1 ? 's' : ''}`;
    document.getElementById('participant-count-label').textContent = `${participants.length} participant${participants.length !== 1 ? 's' : ''}`;

    if (comments.length === 0) {
        list.innerHTML = `
            <div class="no-comments">
                <div class="empty-icon">🗨️</div>
                <p>No comments yet. Be the first to share your thoughts!</p>
            </div>`;
    } else {
        const me = getCurrentUser();
        comments.forEach(comment => {
            list.appendChild(buildCommentEl(comment, articleId, me));
        });
    }

    // Update badge on card
    const badge = document.getElementById(`badge-${articleId}`);
    if (badge) badge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        ${comments.length} comment${comments.length !== 1 ? 's' : ''}`;
}

function buildCommentEl(comment, articleId, me) {
    const isMe = comment.author === me;
    const color = getAvatarColor(comment.author);
    const repliesHtml = (comment.replies || []).map(r => buildReplyHtml(r)).join('');

    const el = document.createElement('div');
    el.className = 'comment-item';
    el.setAttribute('data-comment-id', comment.id);
    el.innerHTML = `
        <div class="comment-avatar ${color}">${comment.author.charAt(0).toUpperCase()}</div>
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-author ${isMe ? 'is-you' : ''}">${escHtml(comment.author)}</span>
                <span class="comment-time">${timeAgo(comment.time)}</span>
            </div>
            <p class="comment-text">${escHtml(comment.text)}</p>
            <div class="comment-actions">
                <button class="comment-action-btn" onclick="handleLike('${articleId}', '${comment.id}', this)">
                    ❤️ <span class="like-count">${comment.likes || 0}</span>
                </button>
                <button class="comment-action-btn" onclick="toggleReplyForm('${comment.id}')">
                    💬 Reply
                </button>
            </div>
            <!-- Replies -->
            <div class="replies-section" id="replies-${comment.id}">
                ${repliesHtml}
            </div>
            <!-- Reply form -->
            <div class="reply-form" id="reply-form-${comment.id}">
                <textarea class="reply-input" placeholder="Write a reply…" rows="2" id="reply-text-${comment.id}"></textarea>
                <button class="reply-send-btn" onclick="postReply('${articleId}', '${comment.id}')">Reply</button>
            </div>
        </div>`;
    return el;
}

function buildReplyHtml(reply) {
    const color = getAvatarColor(reply.author);
    return `
        <div class="reply-item">
            <div class="reply-avatar ${color}">${reply.author.charAt(0).toUpperCase()}</div>
            <div class="reply-body">
                <span class="reply-author">${escHtml(reply.author)}</span>
                <span class="reply-time">${timeAgo(reply.time)}</span>
                <p class="reply-text">${escHtml(reply.text)}</p>
            </div>
        </div>`;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------- Post Comment ---------- */
async function postComment() {
    if (activeArticleIdx === null) return;
    const textarea = document.getElementById('new-comment-text');
    const text = textarea.value.trim();
    if (!text) return;

    const article = currentArticles[activeArticleIdx];
    const articleId = getArticleId(article);
    const comment = {
        id: Date.now().toString(),
        author: getCurrentUser(),
        text,
        time: new Date().toISOString(),
        likes: 0,
        replies: []
    };

    const btn = document.getElementById('post-comment-btn');
    btn.disabled = true;
    btn.textContent = 'Posting…';

    await saveComment(articleId, comment);
    textarea.value = '';
    await renderComments(articleId);

    btn.disabled = false;
    btn.textContent = 'Post Comment';

    // Scroll to bottom of comments
    const list = document.getElementById('comments-list');
    list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- Toggle Reply Form ---------- */
function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;
    const isVisible = form.classList.contains('visible');
    // Close all others first
    document.querySelectorAll('.reply-form.visible').forEach(f => f.classList.remove('visible'));
    if (!isVisible) {
        form.classList.add('visible');
        form.querySelector('textarea')?.focus();
    }
}

/* ---------- Post Reply ---------- */
async function postReply(articleId, commentId) {
    const textarea = document.getElementById(`reply-text-${commentId}`);
    const text = textarea.value.trim();
    if (!text) return;

    const reply = {
        id: Date.now().toString(),
        author: getCurrentUser(),
        text,
        time: new Date().toISOString()
    };

    await saveReply(articleId, commentId, reply);
    textarea.value = '';

    // Add reply to DOM immediately
    const repliesSection = document.getElementById(`replies-${commentId}`);
    if (repliesSection) {
        const el = document.createElement('div');
        el.innerHTML = buildReplyHtml(reply);
        repliesSection.appendChild(el.firstElementChild);
    }
    document.getElementById(`reply-form-${commentId}`)?.classList.remove('visible');

    // Update stats
    const allComments = currentComments[articleId] || [];
    const c = allComments.find(x => x.id === commentId);
    if (c) { if (!c.replies) c.replies = []; c.replies.push(reply); }
}

/* ---------- Like Handler ---------- */
async function handleLike(articleId, commentId, btn) {
    const result = await toggleLike(articleId, commentId);
    const countEl = btn.querySelector('.like-count');
    if (result && countEl) {
        countEl.textContent = result.likes;
    } else if (countEl) {
        const cur = parseInt(countEl.textContent) || 0;
        countEl.textContent = cur + 1;
    }
    btn.classList.toggle('liked');
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    loadUserPreferences();
    fetchCommunityNews();
    // Enter key in comment textarea
    document.getElementById('new-comment-text')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment();
    });
});
