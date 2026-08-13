// GrowthMatrix v2 — self vs manager, compare, promotion screens

// ---------- SELF vs MANAGER ----------
const SELF_SKILLS = ['Detail Orientation','Critical Thinking','Leadership','PRDs','Stakeholder Mgmt','Customer Obsession','Tech Knowledge','Communication'];

function selfScores(mid){
  const sk = mskills(mid);
  return SELF_SKILLS.map(name => {
    const v = sk[name];
    const r = seededRand(mid + name + 'self');
    const delta = r < 0.25 ? -1 : r < 0.6 ? 0 : r < 0.85 ? 1 : 2;
    return { name, mgr: v.c, self: clampv(1, 5, v.c + delta), t: v.e };
  });
}

screens.self = () => {
  const m = member();
  const rows = selfScores(m.id).sort((a,b) => Math.abs(b.self - b.mgr) - Math.abs(a.self - a.mgr));
  const aligned = rows.filter(r => r.self === r.mgr);
  const selfHi = rows.filter(r => r.self > r.mgr);
  const mgrHi = rows.filter(r => r.self < r.mgr);
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Self vs manager · ${firstName(m)}</h1>
      <p class="text-slate-500 text-sm mt-0.5">Both filled blind. Deltas show where to align before the next 1:1.</p>
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <button onclick="toast('Request sent to ' + '${firstName(m)}')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Request next round</button>
      <button onclick="go('oneone')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Discuss in 1:1 →</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-5">
    ${[['Aligned', aligned.length, 'of ' + rows.length + ' skills', 'emerald'], ['Self higher', selfHi.length, 'overestimating', 'amber'], ['Manager higher', mgrHi.length, 'underestimating', 'blue']].map(([l,v,s,c]) => `
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-xs text-slate-500">${l}</div>
        <div class="mt-1 text-2xl font-semibold text-${c}-600">${v} <span class="text-sm text-slate-400 font-normal">${s}</span></div>
      </div>
    `).join('')}
  </div>

  <div class="bg-white border border-slate-200 rounded-xl p-5">
    <div class="flex justify-between items-center mb-4">
      <div class="font-semibold">Where you disagree (sorted by delta)</div>
      <div class="flex gap-3 text-xs text-slate-500">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>Manager</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Self</span>
      </div>
    </div>
    <div class="grid grid-cols-12 gap-3 pb-2 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
      <div class="col-span-3">Skill</div><div class="col-span-1 text-center">Self</div><div class="col-span-1 text-center">Mgr</div><div class="col-span-1 text-center">Δ</div><div class="col-span-5"></div><div class="col-span-1"></div>
    </div>
    <div class="space-y-3">
      ${rows.map(({name, mgr, self, t}) => {
        const d = self - mgr;
        const tone = d > 1 ? 'amber' : d < -1 ? 'blue' : d !== 0 ? 'slate' : 'emerald';
        return `<div class="grid grid-cols-12 gap-3 items-center text-sm">
          <div class="col-span-3 font-medium">${name}</div>
          <div class="col-span-1 text-center">${self}</div>
          <div class="col-span-1 text-center">${mgr}</div>
          <div class="col-span-1 text-center"><span class="text-xs px-2 py-0.5 rounded bg-${tone}-50 text-${tone}-700 border border-${tone}-200 font-medium">${d > 0 ? '+' : ''}${d}</span></div>
          <div class="col-span-5">
            <div class="relative h-2 bg-slate-100 rounded-full">
              <div class="absolute top-[-3px] w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" style="left:calc(${(mgr/5)*100}% - 5px)"></div>
              <div class="absolute top-[-3px] w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" style="left:calc(${(self/5)*100}% - 5px)"></div>
              <div class="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700" style="left:${(t/5)*100}%"></div>
            </div>
          </div>
          <div class="col-span-1 text-right text-xs text-slate-500">target ${t}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <div class="mt-5 grid grid-cols-2 gap-4">
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <div class="font-semibold mb-2 text-amber-700">Biggest perception gaps to address</div>
      <ul class="text-sm space-y-2">
        ${rows.filter(r => r.self !== r.mgr).slice(0, 3).map(r => `
          <li><strong>${r.name}</strong> — they see ${r.self}, you see ${r.mgr}. <span class="text-slate-500">${r.self > r.mgr ? 'Bring specific examples to calibrate.' : 'Tell them why you rate them higher.'}</span></li>
        `).join('') || '<li class="text-slate-500">Fully aligned — rare and great.</li>'}
      </ul>
    </div>
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <div class="font-semibold mb-2 text-emerald-700">Confidence builders</div>
      <ul class="text-sm space-y-2">
        ${aligned.slice(0, 3).map(r => `<li>You both agree on <strong>${r.name}</strong> at ${r.mgr}${r.mgr >= r.t ? ' — strength.' : '.'}</li>`).join('') || '<li class="text-slate-500">No aligned skills this round.</li>'}
      </ul>
    </div>
  </div>
  `;
};

// ---------- COMPARE ----------
screens.compare = () => {
  const ids = S.compare.filter(id => TEAM.some(t => t.id === id));
  const remaining = TEAM.filter(t => !ids.includes(t.id));
  afterLayout(() => initCompareCharts(ids));
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Compare members</h1>
      <p class="text-slate-500 text-sm mt-0.5">Side-by-side, live scores. Add up to 4.</p>
    </div>
    <div class="flex gap-2">
      ${ids.length < 4 && remaining.length ? `
      <select onchange="if(this.value) addCompare(this.value)" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white">
        <option value="">+ Add member…</option>
        ${remaining.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
      </select>` : ''}
      <button onclick="toast('Export is stubbed in this prototype')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Export ↗</button>
    </div>
  </div>

  <div class="grid grid-cols-${Math.min(4, Math.max(2, ids.length))} gap-4 mb-5">
    ${ids.map((id, i) => {
      const t = member(id);
      return `
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">${avatar(t,'sm')}<div><div class="font-medium">${t.name}</div><div class="text-xs text-slate-500">${t.title} · ${t.level}</div></div></div>
          ${ids.length > 1 ? `<button onclick="removeCompare('${id}')" class="text-slate-300 hover:text-slate-500" title="Remove">✕</button>` : ''}
        </div>
        <div style="position:relative;height:180px"><canvas id="cmp-${i}"></canvas></div>
        <div class="flex justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          <span>avg <strong class="text-slate-700">${avgOf(id).toFixed(1)}</strong></span>
          <span>target <strong class="text-slate-700">${targetOf(id).toFixed(1)}</strong></span>
          <span>gap <strong class="text-amber-600">${gapOf(id).toFixed(1)}</strong></span>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div class="px-5 py-3 border-b border-slate-200 font-semibold">Side-by-side · top skills per category</div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
        <tr>
          <th class="text-left py-2 px-4 font-medium">Skill</th>
          ${ids.map(id => `<th class="text-center py-2 px-4 font-medium">${member(id).initials}</th>`).join('')}
          <th class="text-center py-2 px-4 font-medium text-slate-400">Target</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${Object.entries(CATALOG).flatMap(([cat, sks]) => sks.slice(0, 3).map(([n]) => {
          const e = mskills(ids[0])[n].e;
          return `<tr class="hover:bg-slate-50">
            <td class="py-2 px-4"><div class="text-[10px] uppercase tracking-wider text-slate-400">${cat}</div>${n}</td>
            ${ids.map(id => {
              const v = mskills(id)[n];
              const tone = v.c >= v.e ? 'bg-emerald-50 text-emerald-700' : v.c < v.e - 1 ? 'bg-amber-50 text-amber-700' : '';
              return `<td class="py-2 px-4 text-center"><span class="inline-block min-w-[28px] py-0.5 rounded ${tone}">${v.c}</span></td>`;
            }).join('')}
            <td class="py-2 px-4 text-center text-slate-400">${e}</td>
          </tr>`;
        })).join('')}
      </tbody>
    </table>
  </div>
  `;
};

function addCompare(id){ if (!S.compare.includes(id) && S.compare.length < 4) { S.compare.push(id); save(); go('compare'); } }
function removeCompare(id){ S.compare = S.compare.filter(x => x !== id); if (!S.compare.length) S.compare = ['yk']; save(); go('compare'); }

function initCompareCharts(ids){
  ids.forEach((id, i) => {
    const c = document.getElementById('cmp-' + i); if (!c) return;
    const cats = catAvgs(id);
    chartInstances.push(new Chart(c, {
      type: 'radar',
      data: {
        labels: cats.map(x => x.cat.replace(' Skills','')),
        datasets: [
          { data: cats.map(x => +x.cur.toFixed(2)), backgroundColor:'rgba(79,70,229,0.25)', borderColor:'#4f46e5', borderWidth:2, pointBackgroundColor:'#4f46e5' },
          { data: cats.map(x => +x.exp.toFixed(2)), backgroundColor:'rgba(199,210,254,0.30)', borderColor:'#a5b4fc', borderWidth:2, borderDash:[4,3], pointBackgroundColor:'#a5b4fc' }
        ]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ r: Object.assign({}, RADAR_SCALE, { pointLabels:{font:{size:9}, color:'#475569'} }) } }
    }));
  });
}

// ---------- PROMOTION ----------
const CHECKLIST_ITEMS = ['Hard worker','Delivers results','Strong network','Business understanding','Effective communicator','Takes additional responsibilities','Continuous learning','Team player','Proactive'];
const CHECK_DEFAULTS = { dm: { 'Strong network': false, 'Takes additional responsibilities': false } };

function checklistFor(mid){
  const ov = S.checklist[mid] || {};
  const def = CHECK_DEFAULTS[mid] || {};
  return CHECKLIST_ITEMS.map(item => [item, ov[item] != null ? ov[item] : (def[item] != null ? def[item] : true)]);
}
function toggleCheck(mid, item){
  S.checklist[mid] = S.checklist[mid] || {};
  const cur = checklistFor(mid).find(x => x[0] === item)[1];
  S.checklist[mid][item] = !cur;
  save(); go('promo');
}

screens.promo = () => {
  const ranked = TEAM.map(t => ({ t, r: readinessOf(t.id) })).sort((a,b) => b.r - a.r);
  const star = ranked[0].t;
  const items = checklistFor(star.id);
  const met = items.filter(x => x[1]).length;
  const evidence = S.logs.filter(l => l.m === star.id && l.to > l.from).slice(0, 3);
  const nextLevel = { L3:'L4', L4:'L5', L5:'L6', L6:'L7', L7:'L8' };
  afterLayout(() => initPromoChart(star.id));
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Promotion readiness</h1>
      <p class="text-slate-500 text-sm mt-0.5">Auto-evaluated from live skills + checklist + log evidence. Yours to override.</p>
    </div>
    <div class="flex gap-2">
      <button onclick="toast('Shared with HR (stubbed)')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Share with HR ↗</button>
      <button onclick="toast('Promotion case started for ${firstName(star)}')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Start promotion case →</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-5">
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-3">${avatar(star,'md')}<div><div class="font-medium">${star.name}</div><div class="text-xs text-slate-500">${star.title} ${star.level} → ${nextLevel[star.level] || '—'}</div></div></div>
        ${statusBadge(star.status)}
      </div>
      <div class="flex justify-between items-end mb-3">
        <div><div class="text-xs text-slate-500">Readiness</div><div class="text-3xl font-semibold">${readinessOf(star.id)}<span class="text-base text-slate-400">/100</span></div></div>
        <canvas id="promoRadar" width="120" height="120"></canvas>
      </div>
      <div class="text-sm text-slate-700"><strong>${met} of ${items.length}</strong> checklist items met · <span class="${items.length - met > 0 ? 'text-amber-600' : 'text-emerald-600'}">${items.length - met > 0 ? (items.length - met) + ' gaps remaining' : 'all clear'}</span></div>
    </div>

    <div class="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
      <div class="font-semibold mb-1">Promotion checklist · ${star.level} → ${nextLevel[star.level] || '—'}</div>
      <div class="text-xs text-slate-500 mb-3">Click to toggle — your call, not the system's.</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        ${items.map(([l, d]) => `
          <button onclick="toggleCheck('${star.id}','${l}')" class="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 text-left">
            <span class="w-4 h-4 rounded ${d ? 'bg-emerald-500 text-white' : 'border border-slate-300'} flex items-center justify-center text-xs shrink-0">${d ? '✓' : ''}</span>
            <span class="text-sm ${d ? '' : 'text-slate-500'}">${l}</span>
          </button>
        `).join('')}
      </div>
      <div class="border-t border-slate-100 pt-3">
        <div class="text-sm font-medium mb-2">Auto-evidence (from logs)</div>
        ${evidence.length ? `<ul class="text-sm text-slate-600 space-y-1 list-disc list-inside">
          ${evidence.map(l => `<li>"${l.note}" · ${l.d} log (${l.skill} ${l.from}→${l.to})</li>`).join('')}
        </ul>` : '<div class="text-sm text-slate-500">No positive log entries yet — file observations to build the case.</div>'}
      </div>
    </div>
  </div>

  <div class="bg-white border border-slate-200 rounded-xl p-5">
    <div class="font-semibold mb-3">Others on the path</div>
    <div class="grid grid-cols-3 gap-4">
      ${ranked.slice(1, 4).map(({t, r}) => `
        <div class="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50" onclick="goProfile('${t.id}')">
          <div class="flex justify-between items-start"><div class="font-medium">${firstName(t)} ${t.name.split(' ')[1][0]}.</div><span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">${r >= 65 ? 'Close' : r >= 45 ? 'On track' : 'Early'}</span></div>
          <div class="text-xs text-slate-500 mt-0.5">${t.level} → ${nextLevel[t.level] || '—'}</div>
          <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3"><div class="h-full bg-indigo-600" style="width:${r}%"></div></div>
          <div class="text-xs text-slate-500 mt-1">${r}/100 readiness</div>
        </div>
      `).join('')}
    </div>
  </div>
  `;
};

function initPromoChart(mid){
  const c = document.getElementById('promoRadar'); if (!c) return;
  const cats = catAvgs(mid);
  chartInstances.push(new Chart(c, {
    type: 'radar',
    data: { labels: cats.map(() => ''), datasets: [
      { data: cats.map(x => +x.cur.toFixed(2)), backgroundColor:'rgba(79,70,229,0.25)', borderColor:'#4f46e5', borderWidth:2, pointRadius:0 },
      { data: cats.map(x => +x.exp.toFixed(2)), backgroundColor:'rgba(199,210,254,0.20)', borderColor:'#a5b4fc', borderWidth:1.5, borderDash:[3,3], pointRadius:0 }
    ]},
    options: { responsive:false, plugins:{legend:{display:false}, tooltip:{enabled:false}},
      scales:{ r: Object.assign({}, RADAR_SCALE, { pointLabels:{display:false} }) } }
  }));
}
