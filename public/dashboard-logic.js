const categoryColors = {
    technology:'#8b5cf6', finance:'#f59e0b', politics:'#ef4444', social:'#ec4899',
    trending:'#10b981', sports:'#10b981', business:'#f59e0b', entertainment:'#ec4899',
    health:'#14b8a6', science:'#6366f1', world:'#06b6d4', general:'#6b7280'
};
let chartInstance = null;

// Must match user-preferences.js key generation
function getDashboardPrefs() {
    const email = sessionStorage.getItem('userEmail') || 'guest';
    const key   = 'newsPrefs_' + email;
    const raw   = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

function getWeeklyReadingData() {
    const prefs = getDashboardPrefs();
    if (!prefs) return null;
    const all = [...(prefs.clicked_articles||[]), ...(prefs.interested_articles||[])];
    if (!all.length) return null;
    const now = new Date(), weekly = {};
    all.forEach(a => {
        const diff = Math.floor((now - new Date(a.timestamp||Date.now())) / (7*24*60*60*1000));
        if (diff >= 0 && diff < 8) {
            const k = `Week ${8-diff}`;
            if (!weekly[k]) weekly[k] = {};
            const cat = a.category || 'general';
            weekly[k][cat] = (weekly[k][cat] || 0) + 1;
        }
    });
    const timeline = [];
    for (let i = 1; i <= 8; i++) {
        const k = `Week ${i}`, d = weekly[k] || {};
        if (!Object.keys(d).length) continue;
        const top = Object.keys(d).reduce((a,b) => d[a]>d[b]?a:b);
        const s = new Date(now); s.setDate(now.getDate() - (8-i)*7);
        const e = new Date(s);  e.setDate(s.getDate() + 6);
        timeline.push({ week:k, date:`${s.getMonth()+1}/${s.getDate()}-${e.getMonth()+1}/${e.getDate()}`, category:top });
    }
    return timeline.length ? timeline : null;
}

function getCategoryDistribution() {
    const prefs = getDashboardPrefs();
    if (!prefs) return null;
    const all = [...(prefs.clicked_articles||[]), ...(prefs.interested_articles||[])];
    if (!all.length) return null;
    const counts = {};
    all.forEach(a => { const c = a.category||'general'; counts[c] = (counts[c]||0)+1; });
    const total = all.length, pct = {};
    Object.keys(counts).forEach(c => { pct[c] = Math.round((counts[c]/total)*100); });
    return pct;
}

function renderTimeline() {
    const el = document.getElementById('timeline');
    if (!el) return;
    const data = getWeeklyReadingData();
    if (!data) {
        el.innerHTML = `<div class="empty-state" style="width:100%;padding:2rem;"><h3>📚 Start Reading to See Your Journey</h3><p>Click articles or mark as Interested to track your habits.</p></div>`;
        return;
    }
    el.innerHTML = '';
    data.forEach(item => {
        const wi = document.createElement('div'); wi.className = 'week-item';
        const b  = document.createElement('div'); b.className = `week-bubble category-${item.category}`;
        b.textContent = item.category.charAt(0).toUpperCase()+item.category.slice(1);
        b.title = `${item.week}: ${item.date}`;
        const d = document.createElement('div'); d.className = 'week-date'; d.textContent = item.date;
        wi.appendChild(b); wi.appendChild(d); el.appendChild(wi);
    });
}

function renderChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const data = getCategoryDistribution();
    if (!data) {
        canvas.parentElement.innerHTML = `<div class="empty-state"><h3>📊 No Reading Data Yet</h3><p>Explore articles to see your distribution chart!</p></div>`;
        return;
    }
    if (chartInstance) chartInstance.destroy();
    const cats = Object.keys(data), vals = Object.values(data);
    const colors = cats.map(c => categoryColors[c]||'#6b7280');
    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels: cats.map(c=>c.charAt(0).toUpperCase()+c.slice(1)),
                datasets: [{ label:'Articles Read (%)', data:vals,
                    backgroundColor: colors.map(c=>c+'CC'), borderColor:colors, borderWidth:2, borderRadius:8 }] },
        options: { responsive:true, maintainAspectRatio:false,
            plugins: { legend:{display:false},
                tooltip:{ backgroundColor:'rgba(0,0,0,.85)', padding:14, cornerRadius:8,
                    callbacks:{ label: ctx=>`${ctx.parsed.y}% of articles read` } } },
            scales: { y:{ beginAtZero:true, max:Math.max(...vals,30)+10,
                ticks:{ callback:v=>v+'%', font:{size:12} }, grid:{color:'rgba(0,0,0,.06)'} },
                      x:{ ticks:{font:{size:12}}, grid:{display:false} } } }
    });
}

function renderStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    const userName = sessionStorage.getItem('userName') || '';
    // Show greeting with user name
    const header = document.querySelector('.dashboard-header p');
    if (header && userName) header.textContent = `Welcome back, ${userName}! Here's your personal reading summary.`;

    const prefs = getDashboardPrefs();
    if (!prefs) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>📈 No Data Yet</h3><p>Start reading articles to see your personal stats.</p></div>`;
        return;
    }
    const clicked = (prefs.clicked_articles||[]).length;
    const saved   = (prefs.interested_articles||[]).length;
    const total   = clicked + saved;
    if (!total) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>📈 Your Stats Will Appear Here</h3><p>Click and save articles to see stats.</p></div>`;
        return;
    }
    const catData = getCategoryDistribution();
    const wkData  = getWeeklyReadingData();
    const top     = catData ? Object.keys(catData).reduce((a,b)=>catData[a]>catData[b]?a:b) : 'general';
    const avg     = wkData  ? Math.round(total / Math.max(wkData.length,1)) : total;
    grid.innerHTML = '';
    [{ value:total, label:'Total Articles Read' },
     { value:top.charAt(0).toUpperCase()+top.slice(1), label:'Favourite Category' },
     { value:avg,   label:'Weekly Average' },
     { value:saved, label:'Saved Articles' }].forEach(stat => {
        const card = document.createElement('div'); card.className = 'stat-card';
        const v = document.createElement('div'); v.className = 'stat-value'; v.textContent = stat.value;
        const l = document.createElement('div'); l.className = 'stat-label'; l.textContent = stat.label;
        card.appendChild(v); card.appendChild(l); grid.appendChild(card);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { renderTimeline(); renderChart(); renderStats(); }, 100);
});
