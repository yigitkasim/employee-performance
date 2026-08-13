// GrowthMatrix v2 — data model, state, persistence, shared helpers (loaded first)

const GM_KEY = 'growthmatrix-v2-state';
let S = null; // global app state

const CATALOG = {
  "Soft Skills": [["Doer",4,5],["Critical Thinking",3,4],["Leadership",3,4],["Growth Mindset",4,5],["Learning Curve",4,4],["Motivation",4,5],["Detail Orientation",3,4],["Empathy",3,4],["Communication Style",4,4]],
  "Discovery": [["Customer Obsession",3,5],["Research",3,4],["Understanding User Needs",3,4],["Defining User Needs",2,4],["Trends",3,4],["Domain Knowledge",3,4],["Competitor Analysis",3,4]],
  "Design": [["UX Focus",4,4],["Product Strategy",3,5],["Decision-Making",3,4],["PRDs",4,5],["Success Metrics",2,4],["Solution Design",3,4],["Business Modeling",2,3]],
  "Delivery": [["Communication",4,5],["Cross-functional Mgmt",2,4],["Tech Knowledge",3,4],["Planning / Prioritization",3,4],["Data Orientation",3,4],["PDLC",3,4],["Stakeholder Mgmt",2,4]],
  "Adoption": [["Product Iteration",3,4],["GTM Strategy",2,3],["KPI Tracking",3,4],["Training & Demos",3,4],["Launch Checklists",4,4],["Customer Support",3,4],["Documentation",3,4],["Release Notes",3,4],["Feedback Loops",3,4],["Sales Enablement",2,3],["Marketing Liaison",2,3],["Pricing",2,3],["Onboarding",3,4],["Lifecycle Comms",2,3]]
};

const TEAM = [
  { id:"yk", name:"Yağız Kılıç", title:"Product Manager", level:"L5", initials:"YK", color:"bg-indigo-600", target:4.1, gap:0.9, trend:"+0.4", status:"on-track", lastReview:"2w ago" },
  { id:"sa", name:"Sasha Ahmed", title:"Product Manager", level:"L4", initials:"SA", color:"bg-rose-500", target:3.6, gap:1.2, trend:"+0.6", status:"growing", lastReview:"3d ago" },
  { id:"dm", name:"Daniel Müller", title:"Senior PM", level:"L6", initials:"DM", color:"bg-cyan-500", target:4.5, gap:0.3, trend:"+0.1", status:"promo-ready", lastReview:"2w ago" },
  { id:"pr", name:"Priya Raman", title:"Product Manager", level:"L5", initials:"PR", color:"bg-violet-500", target:4.1, gap:0.7, trend:"+0.2", status:"on-track", lastReview:"1mo ago" },
  { id:"jl", name:"Jin Lee", title:"Associate PM", level:"L3", initials:"JL", color:"bg-amber-500", target:3.0, gap:1.0, trend:"+0.5", status:"growing", lastReview:"1w ago" },
  { id:"el", name:"Elena Volkov", title:"Product Manager", level:"L5", initials:"EV", color:"bg-emerald-500", target:4.1, gap:1.1, trend:"0.0", status:"needs-attention", lastReview:"6w ago" },
  { id:"kb", name:"Kaan Bilgi", title:"Senior PM", level:"L6", initials:"KB", color:"bg-pink-500", target:4.6, gap:0.5, trend:"+0.1", status:"on-track", lastReview:"2w ago" },
  { id:"da", name:"Defne Aydın", title:"Product Manager", level:"L5", initials:"DA", color:"bg-teal-500", target:4.2, gap:1.2, trend:"+0.3", status:"on-track", lastReview:"1w ago" },
];

// ---------- seeded generation ----------
function clampv(lo,hi,v){ return Math.max(lo, Math.min(hi, v)); }
function seededRand(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return ((h>>>0)%1000)/1000; }

function defaultState(){
  const members = {};
  TEAM.forEach(t => {
    const skills = {};
    Object.entries(CATALOG).forEach(([cat, arr]) => arr.forEach(([name, ykC, exp]) => {
      let c, e;
      if (t.id === 'yk') { c = ykC; e = exp; }
      else {
        const r = seededRand(t.id + name);
        e = clampv(1,5, Math.round(exp + (t.target - 4.1)));
        c = clampv(1,5, Math.round(e - t.gap + (r - 0.5) * 1.4));
      }
      skills[name] = { c, e, cat };
    }));
    members[t.id] = { skills };
  });
  return {
    v: 2, members,
    logs: seedLogs(), inbox: seedInbox(),
    sim: {}, notes: {}, talking: {}, talkingCustom: {}, checklist: {}, goalsDone: {},
    matrixOv: {}, sources: {"Quick keyboard":true,"Calendar (1:1s, reviews)":true,"Slack starred":true,"Linear / Jira closes":true,"GitHub PR reviews":false,"1:1 transcripts (beta)":false},
    stats: { filed: 9, bumped: 3, archived: 2 },
    compare: ['yk','dm','pr'],
    screen: 'team', member: 'yk', teamSort: 'gap',
  };
}

function seedLogs(){ return [
  { id:1, m:'yk', d:'Apr 22', skill:'PRDs', from:2, to:3, by:'You', note:'Q2 launch PRD was much sharper — clear hypotheses, measurable success metrics.' },
  { id:2, m:'yk', d:'Apr 14', skill:'Stakeholder Mgmt', from:1, to:2, by:'You', note:'Handled the legal escalation independently. Good progress, still leaning on me for sales.' },
  { id:3, m:'yk', d:'Apr 02', skill:'Critical Thinking', from:2, to:3, by:'You', note:'Pushed back thoughtfully on the pricing direction with data.' },
  { id:4, m:'yk', d:'Mar 18', skill:'Detail Orientation', from:1, to:1, by:'You', note:'Still missing things in spec reviews. Pair on next PRD.' },
  { id:5, m:'yk', d:'Mar 04', skill:'Customer Obsession', from:2, to:3, by:'You', note:'Initiated the user interview round without prompting.' },
  { id:6, m:'sa', d:'Apr 25', skill:'Communication', from:3, to:4, by:'You', note:'Nailed the kickoff demo — really commanded the room.' },
  { id:7, m:'dm', d:'Apr 18', skill:'Stakeholder Mgmt', from:4, to:5, by:'You', note:'Owned the exec readout without any coaching.' },
  { id:8, m:'jl', d:'Apr 20', skill:'Research', from:2, to:3, by:'You', note:'First solo usability round — solid synthesis doc.' },
]; }

function seedInbox(){ return [
  { id:1, src:'⌨ Quick', txt:'Sasha nailed the kickoff demo today — really commanded the room.', when:'15m ago', m:'sa', skill:'Communication' },
  { id:2, src:'📅 Calendar', txt:'Pricing review · Yağız presented to exec.', when:'2h ago', m:'yk', skill:'Stakeholder Mgmt' },
  { id:3, src:'🔗 Linear', txt:'Daniel closed FEAT-882 — Q2 launch shipped.', when:'1d ago', m:'dm', skill:'PDLC' },
  { id:4, src:'⌨ Quick', txt:'Elena missed two edge cases in spec review again.', when:'1d ago', m:'el', skill:'Detail Orientation' },
  { id:5, src:'💬 Slack', txt:'Defne ran the user interview round unprompted.', when:'2d ago', m:'da', skill:'Customer Obsession' },
]; }

// ---------- persistence ----------
function loadState(){
  try { const raw = localStorage.getItem(GM_KEY); if (raw){ const p = JSON.parse(raw); if (p && p.v === 2 && p.members) return p; } } catch(e){}
  return defaultState();
}
let _saveT = null;
function save(){ clearTimeout(_saveT); _saveT = setTimeout(() => { try { localStorage.setItem(GM_KEY, JSON.stringify(S)); } catch(e){} }, 120); }

// ---------- computed ----------
function member(id){ return TEAM.find(t => t.id === (id || S.member)); }
function mskills(id){ return S.members[id || S.member].skills; }
function skillsByCat(id){
  const out = {}; Object.keys(CATALOG).forEach(c => out[c] = []);
  Object.entries(mskills(id)).forEach(([n,v]) => out[v.cat].push([n, v.c, v.e]));
  return out;
}
function avgOf(id){ const vs = Object.values(mskills(id)); return vs.reduce((s,v)=>s+v.c,0)/vs.length; }
function targetOf(id){ const vs = Object.values(mskills(id)); return vs.reduce((s,v)=>s+v.e,0)/vs.length; }
function gapOf(id){ return Math.max(0, targetOf(id) - avgOf(id)); }
function gapCount(id){ return Object.values(mskills(id)).filter(v => v.e - v.c >= 1).length; }
function catAvgs(id){
  const byCat = skillsByCat(id);
  return Object.entries(byCat).map(([cat, sks]) => ({
    cat,
    cur: sks.reduce((s,x)=>s+x[1],0)/sks.length,
    exp: sks.reduce((s,x)=>s+x[2],0)/sks.length,
  }));
}
function topGaps(id, n){
  return Object.entries(mskills(id)).map(([name,v]) => [name, v.e - v.c, v.c, v.e])
    .filter(x => x[1] > 0).sort((a,b) => b[1] - a[1]).slice(0, n || 5);
}
function readinessOf(id, overrides){
  const sk = mskills(id); let cur = 0, exp = 0, n = 0;
  for (const [name, v] of Object.entries(sk)) {
    const c = overrides && overrides[name] != null ? Math.max(v.c, overrides[name]) : v.c;
    cur += c; exp += v.e; n++;
  }
  const a = cur/n, t = exp/n;
  return clampv(0, 100, Math.round(100 * (a - 1) / Math.max(0.1, t - 1)));
}
function monthsToNext(id, overrides){
  const sk = mskills(id); let cur = 0, exp = 0, n = 0;
  for (const [name, v] of Object.entries(sk)) {
    const c = overrides && overrides[name] != null ? Math.max(v.c, overrides[name]) : v.c;
    cur += c; exp += v.e; n++;
  }
  return Math.max(1, Math.round(Math.max(0, exp/n - cur/n) * 15));
}
function bandOf(avg){ return avg < 2.5 ? 'Low' : avg < 3.5 ? 'Mid' : avg < 4.2 ? 'High' : 'Top'; }
function fmtToday(){ const d = new Date(); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + String(d.getDate()).padStart(2,'0'); }

// core mutation: set a score, log it, persist
function setScoreCore(memberId, skillName, v, note){
  const sk = mskills(memberId)[skillName]; if (!sk) return null;
  const old = sk.c; if (old === v) return null;
  sk.c = v;
  S.logs.unshift({ id: Date.now(), m: memberId, d: fmtToday(), skill: skillName, from: old, to: v, by: 'You', note: note || 'Updated from rating screen.' });
  save();
  return { old, v };
}

// ---------- shared render helpers ----------
function statusBadge(s){
  const map = {
    "on-track": ['bg-slate-100 text-slate-700','On track'],
    "promo-ready": ['bg-emerald-50 text-emerald-700 border border-emerald-200','Promo ready'],
    "growing": ['bg-blue-50 text-blue-700 border border-blue-200','Growing'],
    "needs-attention": ['bg-amber-50 text-amber-700 border border-amber-200','Needs attention'],
  };
  const [cls, label] = map[s] || map['on-track'];
  return `<span class="text-xs px-2 py-0.5 rounded-full ${cls}">${label}</span>`;
}
function avatar(t, size){
  const s = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return `<div class="${s} rounded-full ${t.color} text-white flex items-center justify-center font-semibold shrink-0">${t.initials}</div>`;
}
function gapBar(cur, target, max){
  max = max || 5;
  return `<div class="relative h-1.5 bg-slate-100 rounded-full overflow-visible">
    <div class="absolute left-0 top-0 bottom-0 bg-indigo-600 rounded-full" style="width:${(cur/max)*100}%"></div>
    <div class="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700" style="left:${(target/max)*100}%"></div>
  </div>`;
}
function memberSelect(){
  return `<select onchange="setMember(this.value)" class="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white">
    ${TEAM.map(t => `<option value="${t.id}" ${t.id===S.member?'selected':''}>${t.name}</option>`).join('')}
  </select>`;
}
function firstName(t){ return t.name.split(' ')[0]; }

let _toastT = null;
function toast(msg){
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg;
  el.classList.remove('opacity-0','translate-y-2'); el.classList.add('opacity-100');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => { el.classList.add('opacity-0','translate-y-2'); el.classList.remove('opacity-100'); }, 2200);
}

// ---------- charts registry ----------
const screens = {};
let chartInstances = [];
function destroyCharts(){ chartInstances.forEach(c => c.destroy()); chartInstances = []; }
function afterLayout(fn){ requestAnimationFrame(() => requestAnimationFrame(fn)); }
const RADAR_SCALE = { suggestedMin:0, suggestedMax:5, ticks:{stepSize:1,display:false}, grid:{color:'#e2e8f0'}, angleLines:{color:'#e2e8f0'} };
