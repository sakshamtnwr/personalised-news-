(async function(){
  const token = sessionStorage.getItem('authToken');
  const onLogin = window.location.pathname.endsWith('login.html') || window.location.pathname === '/';
  if (!token) { if (!onLogin) window.location.replace('/login.html'); return; }
  try {
    const res = await fetch('/api/verify', { headers:{ Authorization:'Bearer '+token } });
    const d   = await res.json();
    if (d.valid) { sessionStorage.setItem('userEmail',d.email); sessionStorage.setItem('userName',d.name||d.email); if (onLogin) window.location.replace('/index.html'); }
    else         { sessionStorage.clear(); if (!onLogin) window.location.replace('/login.html'); }
  } catch(e) { if (!onLogin) window.location.replace('/login.html'); }
})();
function logout(){ sessionStorage.clear(); window.location.replace('/login.html'); }
