// GrowthMatrix v2 — nav, routing, capture modal, keyboard, boot (loaded last)

const NAV = [
  { id:"team",     label:"Team",              icon:"users" },
  { id:"profile",  label:"Profile",           icon:"user" },
  { id:"skills",   label:"Skills (rate)",     icon:"sliders" },
  { id:"gaps",     label:"Skill gaps",        icon:"grid" },
  { id:"sim",      label:"Growth simulator",  icon:"trending" },
  { id:"self",     label:"Self vs manager",   icon:"split" },
  { id:"compare",  label:"Compare members",   icon:"compare" },
  { id:"promo",    label:"Promotion",         icon:"trophy" },
  { id:"oneone",   label:"1:1 prep",          icon:"chat" },
  { id:"logs",     label:"History & log",     icon:"clock" },
  { id:"inbox",    label:"Capture inbox",     icon:"inbox" },
  { id:"settings", label:"Roles & skills",    icon:"cog" },
];

const ICONS = {
  users:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path></svg>',
  user:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a6.5 6.5 0 0113 0"></path></svg>',
  sliders:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h6M9 8h6M17 16h6"></path></svg>',
  grid:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
  trending:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>',
  split:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v18M3 8l6 4-6 4M21 8l-6 4 6 4"></path></svg>',
  compare:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>',
  trophy:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9H4a2 2 0 010-4h2M18 9h2a2 2 0 000-4h-2M6 22h12M12 17v5M7 5h10v6a5 5 0 01-10 0V5z"></path></svg>',
  chat:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>',
  clock:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
  inbox:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"></path></svg>',
  cog:'<svg class="w-4 h-4 nav-icon text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"></path></svg>',
};

function renderNav(active){
  const el = document.getElementById('nav'); if (!el) return;
  el.innerHTML = NAV.map(n => {
    const badge = n.id === 'inbox' && S.inbox.length ? S.inbox.length : null;
    return `
    <button onclick="go('${n.id}')" class="nav-item ${active === n.id ? 'active' : ''} w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 text-left">
      ${ICONS[n.icon]}
      <span class="flex-1">${n.label}</span>
      ${badge ? `<span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">${badge}</span>` : ''}
    </button>`;
  }).join('');
}

// ---------- routing ----------
function go(id){
  destroyCharts();
  if (!screens[id]) id = 'team';
  S.screen = id; save();
  document.getElementById('screen').innerHTML = screens[id]();
  renderNav(id);
  window.scrollTo(0, 0);
}
function goProfile(id){ S.member = id; save(); go('profile'); }
function setMember(id){ S.member = id; save(); go(S.screen); }

// ---------- capture modal ----------
function openCapture(){
  const el = document.getElementById('capture');
  el.classList.remove('hidden'); el.classList.add('flex');
  const ta = document.getElementById('capture-text');
  ta.value = ''; updateCaptureChips(); setTimeout(() => ta.focus(), 30);
}
function closeCapture(){
  const el = document.getElementById('capture');
  el.classList.add('hidden'); el.classList.remove('flex');
}
function updateCaptureChips(){
  const ta = document.getElementById('capture-text');
  const chips = document.getElementById('capture-chips');
  const mid = detectMember(ta.value);
  chips.innerHTML = mid
    ? `<span class="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">@${firstName(member(mid)).toLowerCase()}</span><span class="text-xs text-slate-400 self-center">auto-detected</span>`
    : `<span class="text-xs text-slate-400 self-center">Mention a first name (e.g. "Priya…") to auto-tag</span>`;
}
function saveCapture(){
  const ta = document.getElementById('capture-text');
  if (!ta.value.trim()) { closeCapture(); return; }
  addInboxItem(ta.value.trim());
  closeCapture();
  toast('Captured to inbox');
  if (S.screen === 'inbox') go('inbox');
}

// ---------- keyboard ----------
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); openCapture(); }
  if (e.key === 'Escape') closeCapture();
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !document.getElementById('capture').classList.contains('hidden')) saveCapture();
});

// ---------- reset demo data ----------
function resetAll(){
  if (!confirm('Reset all demo data (scores, logs, inbox, plans)?')) return;
  S = defaultState();
  try { localStorage.setItem(GM_KEY, JSON.stringify(S)); } catch(err){}
  go('team'); toast('Demo data reset');
}

// ---------- boot ----------
S = loadState();
go(S.screen || 'team');
