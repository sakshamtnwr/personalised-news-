const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');

const app        = express();
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = 'news-app-secret-key-change-in-production';
const USERS_FILE    = path.join(__dirname, 'users.json');
const COMMENTS_DIR  = path.join(__dirname, 'data', 'comments');

// ─── Setup ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data dirs exist
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(COMMENTS_DIR)) fs.mkdirSync(COMMENTS_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));

// ─── Helpers ─────────────────────────────────────────────────
function readUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return []; }
}
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function commentsFile(articleId) {
    return path.join(COMMENTS_DIR, `${articleId}.json`);
}
function readComments(articleId) {
    const file = commentsFile(articleId);
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return []; }
}
function writeComments(articleId, data) {
    fs.writeFileSync(commentsFile(articleId), JSON.stringify(data, null, 2));
}

// ─── Auth Routes ─────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    users.push({ id: Date.now().toString(), email, name: name || '', password: hashed, createdAt: new Date().toISOString() });
    writeUsers(users);
    res.status(201).json({ message: 'Account created successfully.' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email, name: user.name });
});

app.get('/api/verify', (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ valid: false });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, email: decoded.email, name: decoded.name });
    } catch {
        res.status(401).json({ valid: false });
    }
});

// ─── Comments Routes ─────────────────────────────────────────
app.get('/api/comments/:articleId', (req, res) => {
    const { articleId } = req.params;
    if (!/^[a-zA-Z0-9_=-]{1,64}$/.test(articleId)) return res.status(400).json({ error: 'Invalid articleId' });
    res.json(readComments(articleId));
});

app.post('/api/comments/:articleId', (req, res) => {
    const { articleId } = req.params;
    if (!/^[a-zA-Z0-9_=-]{1,64}$/.test(articleId)) return res.status(400).json({ error: 'Invalid articleId' });
    const { id, author, text, time, likes, replies } = req.body;
    if (!author || !text) return res.status(400).json({ error: 'author and text are required' });
    const comment = {
        id:      id || Date.now().toString(),
        author:  String(author).slice(0, 80),
        text:    String(text).slice(0, 1000),
        time:    time || new Date().toISOString(),
        likes:   likes || 0,
        replies: replies || []
    };
    const comments = readComments(articleId);
    comments.push(comment);
    writeComments(articleId, comments);
    res.status(201).json(comment);
});

app.post('/api/comments/:articleId/:commentId/reply', (req, res) => {
    const { articleId, commentId } = req.params;
    if (!/^[a-zA-Z0-9_=-]{1,64}$/.test(articleId)) return res.status(400).json({ error: 'Invalid articleId' });
    const { author, text, time } = req.body;
    if (!author || !text) return res.status(400).json({ error: 'author and text are required' });
    const comments = readComments(articleId);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (!comment.replies) comment.replies = [];
    const reply = {
        id:     Date.now().toString(),
        author: String(author).slice(0, 80),
        text:   String(text).slice(0, 500),
        time:   time || new Date().toISOString()
    };
    comment.replies.push(reply);
    writeComments(articleId, comments);
    res.status(201).json(reply);
});

app.post('/api/comments/:articleId/:commentId/like', (req, res) => {
    const { articleId, commentId } = req.params;
    if (!/^[a-zA-Z0-9_=-]{1,64}$/.test(articleId)) return res.status(400).json({ error: 'Invalid articleId' });
    const comments = readComments(articleId);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.likes = (comment.likes || 0) + 1;
    writeComments(articleId, comments);
    res.json({ likes: comment.likes });
});

// ─── Fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ─── Start with auto port fallback ────────────────────────────
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`\n✅  News App running at http://localhost:${port}`);
        console.log(`   Login:     http://localhost:${port}/login.html`);
        console.log(`   Homepage:  http://localhost:${port}/index.html`);
        console.log(`   Community: http://localhost:${port}/community.html`);
        console.log(`   Dashboard: http://localhost:${port}/dashboard.html\n`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Port ${port} in use — trying port ${port + 1}…`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

startServer(PORT);
